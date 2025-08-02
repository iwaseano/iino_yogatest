"""
ヨガレッスン予約管理クラス
ビジネスロジックとバリデーションを担当
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
import re

from storage_manager import StorageManager, ReservationModel
from pydantic import ValidationError

# ログ設定
logger = logging.getLogger(__name__)


class ReservationManager:
    """
    ヨガレッスン予約のビジネスロジック管理クラス

    機能:
    - 予約作成・更新・検索
    - スケジュール管理
    - バリデーション
    - 通知（将来実装）
    """

    # クラススケジュール定義
    CLASS_SCHEDULES = {
        "hatha": {
            "name": "ハタヨガ",
            "schedule": "月・水・金 10:00-11:00",
            "duration": 60,
            "capacity": 12,
            "level": "初心者〜中級者",
        },
        "power": {
            "name": "パワーヨガ",
            "schedule": "火・木・土 19:00-20:00",
            "duration": 60,
            "capacity": 10,
            "level": "中級者〜上級者",
        },
        "restorative": {
            "name": "リストラティブヨガ",
            "schedule": "日 17:00-18:30",
            "duration": 90,
            "capacity": 8,
            "level": "すべてのレベル",
        },
    }

    def __init__(self, storage_manager: StorageManager):
        """
        予約マネージャーの初期化

        Args:
            storage_manager: ストレージ管理インスタンス
        """
        self.storage = storage_manager

    def _validate_email(self, email: str) -> bool:
        """メールアドレスのバリデーション"""
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return re.match(pattern, email) is not None

    def _validate_phone(self, phone: str) -> bool:
        """電話番号のバリデーション（日本の形式）"""
        # ハイフンあり・なし両方対応
        pattern = r"^(\d{2,4}-\d{2,4}-\d{4}|\d{10,11})$"
        cleaned_phone = re.sub(r"[^\d-]", "", phone)
        return re.match(pattern, cleaned_phone) is not None

    def _validate_booking_date(
        self, booking_date: str, class_type: str
    ) -> Dict[str, Any]:
        """
        予約日のバリデーション

        Args:
            booking_date: 予約日（YYYY-MM-DD形式）
            class_type: クラスタイプ

        Returns:
            Dict: バリデーション結果
        """
        try:
            date_obj = datetime.strptime(booking_date, "%Y-%m-%d").date()
            today = datetime.now(timezone.utc).date()

            # 過去の日付チェック
            if date_obj < today:
                return {"valid": False, "error": "過去の日付は予約できません"}

            # 3ヶ月先までの制限
            max_date = today + timedelta(days=90)
            if date_obj > max_date:
                return {"valid": False, "error": "3ヶ月先までの予約が可能です"}

            # 曜日チェック
            weekday = date_obj.weekday()  # 0=月曜日, 6=日曜日

            class_info = self.CLASS_SCHEDULES.get(class_type)
            if not class_info:
                return {"valid": False, "error": "無効なクラスタイプです"}

            # クラス別曜日チェック
            valid_weekdays = {
                "hatha": [0, 2, 4],  # 月・水・金
                "power": [1, 3, 5],  # 火・木・土
                "restorative": [6],  # 日
            }

            if weekday not in valid_weekdays.get(class_type, []):
                return {
                    "valid": False,
                    "error": f"{class_info['name']}は{class_info['schedule']}のスケジュールです",
                }

            return {"valid": True, "class_info": class_info, "weekday": weekday}

        except ValueError:
            return {"valid": False, "error": "日付形式が正しくありません（YYYY-MM-DD）"}

    async def create_reservation(
        self, reservation_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        新規予約作成

        Args:
            reservation_data: 予約データ

        Returns:
            Dict: 作成結果
        """
        try:
            # 必須フィールドチェック
            required_fields = [
                "class_name",
                "class_schedule",
                "booking_date",
                "customer_name",
                "customer_email",
                "customer_phone",
            ]

            for field in required_fields:
                if not reservation_data.get(field):
                    return {
                        "success": False,
                        "error": f"必須フィールドが不足しています: {field}",
                    }

            # メールアドレスバリデーション
            if not self._validate_email(reservation_data["customer_email"]):
                return {
                    "success": False,
                    "error": "有効なメールアドレスを入力してください",
                }

            # 電話番号バリデーション
            if not self._validate_phone(reservation_data["customer_phone"]):
                return {"success": False, "error": "有効な電話番号を入力してください"}

            # クラスタイプの取得
            class_type = None
            for key, info in self.CLASS_SCHEDULES.items():
                if info["name"] == reservation_data["class_name"]:
                    class_type = key
                    break

            if not class_type:
                return {"success": False, "error": "無効なクラス名です"}

            # 予約日バリデーション
            date_validation = self._validate_booking_date(
                reservation_data["booking_date"], class_type
            )

            if not date_validation["valid"]:
                return {"success": False, "error": date_validation["error"]}

            # 定員チェック（将来実装）
            # capacity_check = await self._check_capacity(
            #     reservation_data["booking_date"],
            #     class_type
            # )

            # 予約保存
            reservation_id = await self.storage.save_reservation(reservation_data)

            logger.info(f"新規予約作成: {reservation_id}")

            return {
                "success": True,
                "reservation_id": reservation_id,
                "message": "予約が正常に作成されました",
                "class_info": date_validation["class_info"],
            }

        except ValidationError as e:
            logger.error(f"データバリデーションエラー: {e}")
            return {"success": False, "error": "入力データが正しくありません"}
        except Exception as e:
            logger.error(f"予約作成エラー: {e}")
            return {"success": False, "error": "予約の作成に失敗しました"}

    async def get_reservation_by_id(self, reservation_id: str) -> Dict[str, Any]:
        """
        予約ID検索

        Args:
            reservation_id: 予約ID

        Returns:
            Dict: 検索結果
        """
        try:
            reservation = await self.storage.get_reservation(reservation_id)

            if not reservation:
                return {"success": False, "error": "予約が見つかりません"}

            return {"success": True, "reservation": reservation}

        except Exception as e:
            logger.error(f"予約検索エラー: {e}")
            return {"success": False, "error": "予約の検索に失敗しました"}

    async def get_reservations_by_email(self, email: str) -> Dict[str, Any]:
        """
        メールアドレスで予約検索

        Args:
            email: 顧客メールアドレス

        Returns:
            Dict: 検索結果
        """
        try:
            if not self._validate_email(email):
                return {
                    "success": False,
                    "error": "有効なメールアドレスを入力してください",
                }

            reservations = await self.storage.get_reservations_by_email(email)

            # 予約データに追加情報を付与
            enriched_reservations = []
            for reservation in reservations:
                class_type = None
                for key, info in self.CLASS_SCHEDULES.items():
                    if info["name"] == reservation.get("class_name"):
                        class_type = key
                        break

                reservation["class_type"] = class_type
                reservation["class_info"] = self.CLASS_SCHEDULES.get(class_type, {})
                enriched_reservations.append(reservation)

            return {
                "success": True,
                "reservations": enriched_reservations,
                "count": len(enriched_reservations),
            }

        except Exception as e:
            logger.error(f"メール検索エラー: {e}")
            return {"success": False, "error": "予約の検索に失敗しました"}

    async def cancel_reservation(
        self, reservation_id: str, email: str
    ) -> Dict[str, Any]:
        """
        予約キャンセル

        Args:
            reservation_id: 予約ID
            email: 予約者のメールアドレス（認証用）

        Returns:
            Dict: キャンセル結果
        """
        try:
            # 予約存在確認
            reservation = await self.storage.get_reservation(reservation_id)
            if not reservation:
                return {"success": False, "error": "予約が見つかりません"}

            # メールアドレス確認（セキュリティ）
            if reservation.get("customer_email", "").lower() != email.lower():
                return {
                    "success": False,
                    "error": "予約者のメールアドレスと一致しません",
                }

            # 既にキャンセル済みチェック
            if reservation.get("status") == "cancelled":
                return {
                    "success": False,
                    "error": "この予約は既にキャンセルされています",
                }

            # キャンセル期限チェック（レッスンの24時間前まで）
            booking_date = datetime.strptime(reservation["booking_date"], "%Y-%m-%d")
            current_time = datetime.now(timezone.utc).replace(tzinfo=None)

            if booking_date <= current_time + timedelta(hours=24):
                return {
                    "success": False,
                    "error": "レッスンの24時間前を過ぎているため、キャンセルできません",
                }

            # ステータス更新
            success = await self.storage.update_reservation_status(
                reservation_id, "cancelled"
            )

            if success:
                logger.info(f"予約キャンセル完了: {reservation_id}")
                return {"success": True, "message": "予約をキャンセルしました"}
            else:
                return {"success": False, "error": "キャンセル処理に失敗しました"}

        except Exception as e:
            logger.error(f"キャンセルエラー: {e}")
            return {"success": False, "error": "キャンセル処理に失敗しました"}

    def get_class_schedules(self) -> Dict[str, Any]:
        """
        クラススケジュール情報を取得

        Returns:
            Dict: クラススケジュール
        """
        return {"success": True, "schedules": self.CLASS_SCHEDULES}

    async def get_availability(self, class_type: str, date: str) -> Dict[str, Any]:
        """
        クラスの空き状況確認（将来実装）

        Args:
            class_type: クラスタイプ
            date: 日付

        Returns:
            Dict: 空き状況
        """
        # 現在は常に空きありとして返す
        # 実際の実装では、その日の予約数をカウントして定員と比較
        class_info = self.CLASS_SCHEDULES.get(class_type)
        if not class_info:
            return {"success": False, "error": "無効なクラスタイプです"}

        return {
            "success": True,
            "available": True,
            "capacity": class_info["capacity"],
            "booked": 0,  # 実装時に実際の予約数を取得
            "remaining": class_info["capacity"],
        }
