"""
Azure Functions - ヨガレッスン予約システム API
HTTPトリガー関数でRESTful APIを提供
"""

import azure.functions as func
import logging
import json
import os
from typing import Dict, Any

from storage_manager import StorageManager
from reservation_manager import ReservationManager

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Azure Functions アプリの初期化
app = func.FunctionApp()

# グローバル変数（関数間で共有）
storage_manager = None
reservation_manager = None


def get_managers():
    """ストレージとビジネスロジックマネージャーを取得"""
    global storage_manager, reservation_manager
    
    if storage_manager is None:
        # 環境変数からストレージアカウント名を取得
        storage_account_name = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
        if not storage_account_name:
            raise ValueError("AZURE_STORAGE_ACCOUNT_NAME環境変数が設定されていません")
        
        storage_manager = StorageManager(storage_account_name)
        reservation_manager = ReservationManager(storage_manager)
    
    return storage_manager, reservation_manager


def create_response(data: Dict[str, Any], status_code: int = 200) -> func.HttpResponse:
    """HTTPレスポンスを作成"""
    return func.HttpResponse(
        json.dumps(data, ensure_ascii=False, indent=2),
        status_code=status_code,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",  # CORS対応
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    )


def create_error_response(message: str, status_code: int = 400) -> func.HttpResponse:
    """エラーレスポンスを作成"""
    return create_response({
        "success": False,
        "error": message
    }, status_code)


@app.route(route="health", methods=["GET"])
async def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """
    ヘルスチェックエンドポイント
    GET /api/health
    """
    try:
        storage_manager, _ = get_managers()
        health_status = await storage_manager.health_check()
        
        return create_response({
            "success": True,
            "status": "healthy",
            "storage": health_status,
            "timestamp": func.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"ヘルスチェックエラー: {e}")
        return create_error_response(
            "サービスが利用できません", 
            503
        )


@app.route(route="reservations", methods=["POST"])
async def create_reservation(req: func.HttpRequest) -> func.HttpResponse:
    """
    新規予約作成エンドポイント
    POST /api/reservations
    
    Body:
    {
        "class_name": "ハタヨガ",
        "class_schedule": "月・水・金 10:00-11:00",
        "booking_date": "2025-08-15",
        "customer_name": "田中太郎",
        "customer_email": "tanaka@example.com",
        "customer_phone": "090-1234-5678",
        "booking_notes": "初回参加です"
    }
    """
    try:
        # リクエストボディの解析
        try:
            req_body = req.get_json()
        except ValueError:
            return create_error_response("無効なJSONフォーマットです")
        
        if not req_body:
            return create_error_response("リクエストボディが必要です")
        
        # 予約作成
        _, reservation_manager = get_managers()
        result = await reservation_manager.create_reservation(req_body)
        
        if result["success"]:
            logger.info(f"予約作成成功: {result.get('reservation_id')}")
            return create_response(result, 201)
        else:
            return create_error_response(result.get("error", "予約作成に失敗しました"))
        
    except Exception as e:
        logger.error(f"予約作成エラー: {e}")
        return create_error_response("内部サーバーエラー", 500)


@app.route(route="reservations/{reservation_id}", methods=["GET"])
async def get_reservation(req: func.HttpRequest) -> func.HttpResponse:
    """
    予約ID検索エンドポイント
    GET /api/reservations/{reservation_id}
    """
    try:
        reservation_id = req.route_params.get('reservation_id')
        if not reservation_id:
            return create_error_response("予約IDが必要です")
        
        _, reservation_manager = get_managers()
        result = await reservation_manager.get_reservation_by_id(reservation_id)
        
        if result["success"]:
            return create_response(result)
        else:
            return create_error_response(result.get("error", "予約が見つかりません"), 404)
        
    except Exception as e:
        logger.error(f"予約検索エラー: {e}")
        return create_error_response("内部サーバーエラー", 500)


@app.route(route="reservations/search", methods=["GET"])
async def search_reservations(req: func.HttpRequest) -> func.HttpResponse:
    """
    メールアドレスで予約検索エンドポイント
    GET /api/reservations/search?email=customer@example.com
    """
    try:
        email = req.params.get('email')
        if not email:
            return create_error_response("emailパラメータが必要です")
        
        _, reservation_manager = get_managers()
        result = await reservation_manager.get_reservations_by_email(email)
        
        if result["success"]:
            return create_response(result)
        else:
            return create_error_response(result.get("error", "検索に失敗しました"))
        
    except Exception as e:
        logger.error(f"予約検索エラー: {e}")
        return create_error_response("内部サーバーエラー", 500)


@app.route(route="reservations/{reservation_id}/cancel", methods=["POST"])
async def cancel_reservation(req: func.HttpRequest) -> func.HttpResponse:
    """
    予約キャンセルエンドポイント
    POST /api/reservations/{reservation_id}/cancel
    
    Body:
    {
        "email": "customer@example.com"
    }
    """
    try:
        reservation_id = req.route_params.get('reservation_id')
        if not reservation_id:
            return create_error_response("予約IDが必要です")
        
        # リクエストボディからメールアドレスを取得
        try:
            req_body = req.get_json()
        except ValueError:
            return create_error_response("無効なJSONフォーマットです")
        
        if not req_body or not req_body.get('email'):
            return create_error_response("メールアドレスが必要です")
        
        email = req_body.get('email')
        
        _, reservation_manager = get_managers()
        result = await reservation_manager.cancel_reservation(reservation_id, email)
        
        if result["success"]:
            return create_response(result)
        else:
            return create_error_response(result.get("error", "キャンセルに失敗しました"))
        
    except Exception as e:
        logger.error(f"キャンセルエラー: {e}")
        return create_error_response("内部サーバーエラー", 500)


@app.route(route="classes", methods=["GET"])
async def get_class_schedules(req: func.HttpRequest) -> func.HttpResponse:
    """
    クラススケジュール取得エンドポイント
    GET /api/classes
    """
    try:
        _, reservation_manager = get_managers()
        result = reservation_manager.get_class_schedules()
        
        return create_response(result)
        
    except Exception as e:
        logger.error(f"スケジュール取得エラー: {e}")
        return create_error_response("内部サーバーエラー", 500)


@app.route(route="classes/{class_type}/availability", methods=["GET"])
async def check_availability(req: func.HttpRequest) -> func.HttpResponse:
    """
    クラス空き状況確認エンドポイント
    GET /api/classes/{class_type}/availability?date=2025-08-15
    """
    try:
        class_type = req.route_params.get('class_type')
        date = req.params.get('date')
        
        if not class_type or not date:
            return create_error_response("クラスタイプと日付が必要です")
        
        _, reservation_manager = get_managers()
        result = await reservation_manager.get_availability(class_type, date)
        
        if result["success"]:
            return create_response(result)
        else:
            return create_error_response(result.get("error", "空き状況確認に失敗しました"))
        
    except Exception as e:
        logger.error(f"空き状況確認エラー: {e}")
        return create_error_response("内部サーバーエラー", 500)


@app.route(route="reservations", methods=["OPTIONS"])
@app.route(route="reservations/{reservation_id}", methods=["OPTIONS"])
@app.route(route="reservations/search", methods=["OPTIONS"])
@app.route(route="reservations/{reservation_id}/cancel", methods=["OPTIONS"])
@app.route(route="classes", methods=["OPTIONS"])
@app.route(route="classes/{class_type}/availability", methods=["OPTIONS"])
async def handle_options(req: func.HttpRequest) -> func.HttpResponse:
    """
    CORS プリフライトリクエスト対応
    """
    return func.HttpResponse(
        "",
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400"
        }
    )