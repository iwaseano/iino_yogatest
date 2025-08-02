"""
Azure Blob Storage管理クラス
ヨガレッスン予約データをJSON形式で安全に管理
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from uuid import uuid4

from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential
from azure.core.exceptions import (
    ResourceNotFoundError,
    ServiceRequestError,
    ClientAuthenticationError,
)
from pydantic import BaseModel, ValidationError

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ReservationModel(BaseModel):
    """予約データのバリデーションモデル"""

    id: str
    class_name: str
    class_schedule: str
    booking_date: str
    customer_name: str
    customer_email: str
    customer_phone: str
    booking_notes: Optional[str] = ""
    created_at: str
    status: str = "confirmed"  # confirmed, cancelled, completed


class StorageManager:
    """
    Azure Blob Storageを使用した予約データ管理クラス

    セキュリティ機能:
    - Managed Identityによる認証
    - 暗号化された通信
    - アクセス制御
    """

    def __init__(
        self, storage_account_name: str = None, container_name: str = "reservations"
    ):
        """
        ストレージマネージャーの初期化

        Args:
            storage_account_name: ストレージアカウント名（環境変数から取得も可能）
            container_name: コンテナ名（デフォルト: reservations）
        """
        self.storage_account_name = storage_account_name or os.getenv(
            "AZURE_STORAGE_ACCOUNT_NAME"
        )
        self.container_name = container_name

        if not self.storage_account_name:
            raise ValueError("ストレージアカウント名が設定されていません")

        # Managed Identityを使用した認証（セキュリティベストプラクティス）
        try:
            self.credential = ManagedIdentityCredential()
            # フォールバック: ローカル開発環境用
            if not self._test_credential():
                self.credential = DefaultAzureCredential()
        except Exception:
            self.credential = DefaultAzureCredential()

        # Blob Service Clientの初期化
        account_url = f"https://{self.storage_account_name}.blob.core.windows.net"
        self.blob_service_client = BlobServiceClient(
            account_url=account_url, credential=self.credential
        )

        # コンテナの初期化
        self._ensure_container_exists()

    def _test_credential(self) -> bool:
        """認証情報のテスト"""
        try:
            # 簡単な認証テスト
            self.credential.get_token("https://storage.azure.com/.default")
            return True
        except Exception:
            return False

    def _ensure_container_exists(self) -> None:
        """コンテナが存在することを確認し、なければ作成"""
        try:
            container_client = self.blob_service_client.get_container_client(
                self.container_name
            )
            container_client.get_container_properties()
            logger.info(f"コンテナ '{self.container_name}' が存在します")
        except ResourceNotFoundError:
            try:
                self.blob_service_client.create_container(self.container_name)
                logger.info(f"コンテナ '{self.container_name}' を作成しました")
            except Exception as e:
                logger.error(f"コンテナ作成エラー: {e}")
                raise
        except Exception as e:
            logger.error(f"コンテナ確認エラー: {e}")
            raise

    def _get_blob_name(self, reservation_id: str) -> str:
        """予約IDからBlob名を生成"""
        date_prefix = datetime.now(timezone.utc).strftime("%Y/%m")
        return f"{date_prefix}/{reservation_id}.json"

    def _get_index_blob_name(self) -> str:
        """インデックスファイルのBlob名"""
        return "index/reservations_index.json"

    async def save_reservation(self, reservation_data: Dict[str, Any]) -> str:
        """
        予約データを保存

        Args:
            reservation_data: 予約データ辞書

        Returns:
            str: 予約ID

        Raises:
            ValidationError: データバリデーションエラー
            ServiceRequestError: Azure Storage エラー
        """
        try:
            # 予約IDの生成
            reservation_id = str(uuid4())

            # 現在時刻の追加
            current_time = datetime.now(timezone.utc).isoformat()
            reservation_data.update({"id": reservation_id, "created_at": current_time})

            # データバリデーション
            reservation = ReservationModel(**reservation_data)

            # JSON形式でシリアライズ
            json_data = reservation.model_dump()
            blob_data = json.dumps(json_data, ensure_ascii=False, indent=2)

            # Blobに保存
            blob_name = self._get_blob_name(reservation_id)
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, blob=blob_name
            )

            # メタデータの追加
            metadata = {
                "customer_email": reservation.customer_email,
                "class_name": reservation.class_name,
                "booking_date": reservation.booking_date,
                "created_at": current_time,
            }

            blob_client.upload_blob(
                blob_data, metadata=metadata, overwrite=True, encoding="utf-8"
            )

            # インデックスの更新
            await self._update_index(reservation)

            logger.info(f"予約保存完了: {reservation_id}")
            return reservation_id

        except ValidationError as e:
            logger.error(f"データバリデーションエラー: {e}")
            raise
        except Exception as e:
            logger.error(f"予約保存エラー: {e}")
            raise ServiceRequestError(f"予約の保存に失敗しました: {e}")

    async def get_reservation(self, reservation_id: str) -> Optional[Dict[str, Any]]:
        """
        予約データを取得

        Args:
            reservation_id: 予約ID

        Returns:
            Optional[Dict]: 予約データ（見つからない場合はNone）
        """
        try:
            blob_name = self._get_blob_name(reservation_id)
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, blob=blob_name
            )

            blob_data = blob_client.download_blob().readall()
            return json.loads(blob_data.decode("utf-8"))

        except ResourceNotFoundError:
            logger.warning(f"予約が見つかりません: {reservation_id}")
            return None
        except Exception as e:
            logger.error(f"予約取得エラー: {e}")
            raise ServiceRequestError(f"予約の取得に失敗しました: {e}")

    async def get_reservations_by_email(self, email: str) -> List[Dict[str, Any]]:
        """
        メールアドレスで予約を検索

        Args:
            email: 顧客のメールアドレス

        Returns:
            List[Dict]: 予約データのリスト
        """
        try:
            reservations = []
            container_client = self.blob_service_client.get_container_client(
                self.container_name
            )

            # メタデータでフィルタリング
            blob_list = container_client.list_blobs(include=["metadata"])

            for blob in blob_list:
                if (
                    blob.metadata
                    and blob.metadata.get("customer_email", "").lower() == email.lower()
                    and not blob.name.startswith("index/")
                ):

                    blob_client = container_client.get_blob_client(blob.name)
                    blob_data = blob_client.download_blob().readall()
                    reservation_data = json.loads(blob_data.decode("utf-8"))
                    reservations.append(reservation_data)

            # 作成日時でソート（新しい順）
            reservations.sort(key=lambda x: x.get("created_at", ""), reverse=True)

            logger.info(f"メール検索結果: {email} - {len(reservations)}件")
            return reservations

        except Exception as e:
            logger.error(f"メール検索エラー: {e}")
            raise ServiceRequestError(f"予約の検索に失敗しました: {e}")

    async def update_reservation_status(self, reservation_id: str, status: str) -> bool:
        """
        予約ステータスを更新

        Args:
            reservation_id: 予約ID
            status: 新しいステータス

        Returns:
            bool: 更新成功フラグ
        """
        try:
            # 既存データを取得
            reservation_data = await self.get_reservation(reservation_id)
            if not reservation_data:
                return False

            # ステータス更新
            reservation_data["status"] = status
            reservation_data["updated_at"] = datetime.now(timezone.utc).isoformat()

            # データバリデーション
            reservation = ReservationModel(**reservation_data)

            # 保存
            blob_name = self._get_blob_name(reservation_id)
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, blob=blob_name
            )

            json_data = reservation.model_dump()
            blob_data = json.dumps(json_data, ensure_ascii=False, indent=2)

            blob_client.upload_blob(blob_data, overwrite=True, encoding="utf-8")

            logger.info(f"ステータス更新完了: {reservation_id} -> {status}")
            return True

        except Exception as e:
            logger.error(f"ステータス更新エラー: {e}")
            return False

    async def _update_index(self, reservation: ReservationModel) -> None:
        """インデックスファイルの更新（検索性能向上のため）"""
        try:
            index_blob_name = self._get_index_blob_name()

            # 既存インデックスを取得
            try:
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name, blob=index_blob_name
                )
                blob_data = blob_client.download_blob().readall()
                index_data = json.loads(blob_data.decode("utf-8"))
            except ResourceNotFoundError:
                index_data = {"reservations": []}

            # 新しい予約をインデックスに追加
            index_entry = {
                "id": reservation.id,
                "customer_email": reservation.customer_email,
                "class_name": reservation.class_name,
                "booking_date": reservation.booking_date,
                "created_at": reservation.created_at,
                "status": reservation.status,
            }

            index_data["reservations"].append(index_entry)
            index_data["last_updated"] = datetime.now(timezone.utc).isoformat()

            # インデックスを保存
            index_json = json.dumps(index_data, ensure_ascii=False, indent=2)
            blob_client.upload_blob(index_json, overwrite=True, encoding="utf-8")

        except Exception as e:
            # インデックス更新失敗は警告レベル（予約自体は成功）
            logger.warning(f"インデックス更新失敗: {e}")

    async def health_check(self) -> Dict[str, Any]:
        """
        ストレージ接続のヘルスチェック

        Returns:
            Dict: ヘルスチェック結果
        """
        try:
            container_client = self.blob_service_client.get_container_client(
                self.container_name
            )
            properties = container_client.get_container_properties()

            return {
                "status": "healthy",
                "storage_account": self.storage_account_name,
                "container": self.container_name,
                "last_modified": (
                    properties.last_modified.isoformat()
                    if properties.last_modified
                    else None
                ),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "storage_account": self.storage_account_name,
                "container": self.container_name,
            }
