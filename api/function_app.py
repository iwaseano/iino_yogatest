"""
Azure Functions - 予約管理API
HTTP Triggerを使用したREST APIエンドポイント
"""

import azure.functions as func
import azure.functions.decorators as func_decorators
import json
import logging
from typing import Optional
from reservation_manager import ReservationRequest, ReservationManager
from storage_manager import StorageManager


# ロギングの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = func.FunctionApp()


@app.function_name("get_reservations")
@app.route(route="reservations", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
async def get_reservations(req: func.HttpRequest) -> func.HttpResponse:
    """
    予約一覧取得API
    Query Parameters:
    - email: メールアドレスによるフィルタ
    - date: 日付によるフィルタ (YYYY-MM-DD)
    - status: ステータスによるフィルタ (confirmed, cancelled)
    """
    try:
        # クエリパラメータの取得
        email = req.params.get("email")
        date = req.params.get("date")
        status = req.params.get("status")

        storage_manager = StorageManager()

        # 検索条件に応じて予約データを取得
        reservations = await storage_manager.search_reservations(
            email=email, date=date, status=status
        )

        # レスポンス用にデータを変換
        reservations_data = [reservation.to_dict() for reservation in reservations]

        return func.HttpResponse(
            json.dumps(
                {
                    "status": "success",
                    "data": reservations_data,
                    "count": len(reservations_data),
                },
                ensure_ascii=False,
            ),
            status_code=200,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )

    except Exception as e:
        logger.error(f"Error in get_reservations: {str(e)}")
        return func.HttpResponse(
            json.dumps(
                {
                    "status": "error",
                    "message": "Failed to retrieve reservations",
                    "error": str(e),
                },
                ensure_ascii=False,
            ),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )


@app.function_name("create_reservation")
@app.route(route="reservations", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
async def create_reservation(req: func.HttpRequest) -> func.HttpResponse:
    """
    新規予約作成API
    Request Body: ReservationRequest JSON
    """
    try:
        # リクエストボディの解析
        req_body = req.get_json()
        if not req_body:
            return func.HttpResponse(
                json.dumps(
                    {"status": "error", "message": "Request body is required"},
                    ensure_ascii=False,
                ),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        # バリデーション
        try:
            reservation_request = ReservationRequest(**req_body)
        except Exception as validation_error:
            return func.HttpResponse(
                json.dumps(
                    {
                        "status": "error",
                        "message": "Invalid request data",
                        "errors": str(validation_error),
                    },
                    ensure_ascii=False,
                ),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        # 予約作成
        manager = ReservationManager()
        reservation = manager.create_reservation(reservation_request)

        # ストレージに保存
        storage_manager = StorageManager()
        await storage_manager.add_reservation(reservation)

        logger.info(f"Created reservation: {reservation.id}")

        return func.HttpResponse(
            json.dumps(
                {
                    "status": "success",
                    "message": "Reservation created successfully",
                    "data": reservation.to_dict(),
                },
                ensure_ascii=False,
            ),
            status_code=201,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )

    except ValueError as e:
        if "Duplicate reservation" in str(e):
            return func.HttpResponse(
                json.dumps(
                    {
                        "status": "error",
                        "message": "Duplicate reservation found",
                        "error": "同じ日時に既に予約があります",
                    },
                    ensure_ascii=False,
                ),
                status_code=409,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )
        else:
            return func.HttpResponse(
                json.dumps(
                    {
                        "status": "error",
                        "message": "Invalid request data",
                        "error": str(e),
                    },
                    ensure_ascii=False,
                ),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )
    except Exception as e:
        logger.error(f"Error in create_reservation: {str(e)}")
        return func.HttpResponse(
            json.dumps(
                {
                    "status": "error",
                    "message": "Failed to create reservation",
                    "error": str(e),
                },
                ensure_ascii=False,
            ),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )


@app.function_name("get_reservation")
@app.route(
    route="reservations/{reservation_id}",
    methods=["GET"],
    auth_level=func.AuthLevel.ANONYMOUS,
)
async def get_reservation(req: func.HttpRequest) -> func.HttpResponse:
    """
    特定予約取得API
    Path Parameter: reservation_id
    """
    try:
        reservation_id = req.route_params.get("reservation_id")

        if not reservation_id:
            return func.HttpResponse(
                json.dumps(
                    {"status": "error", "message": "Reservation ID is required"},
                    ensure_ascii=False,
                ),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        storage_manager = StorageManager()
        reservation = await storage_manager.get_reservation_by_id(reservation_id)

        if not reservation:
            return func.HttpResponse(
                json.dumps(
                    {"status": "error", "message": "Reservation not found"},
                    ensure_ascii=False,
                ),
                status_code=404,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        return func.HttpResponse(
            json.dumps(
                {"status": "success", "data": reservation.to_dict()}, ensure_ascii=False
            ),
            status_code=200,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )

    except Exception as e:
        logger.error(f"Error in get_reservation: {str(e)}")
        return func.HttpResponse(
            json.dumps(
                {
                    "status": "error",
                    "message": "Failed to retrieve reservation",
                    "error": str(e),
                },
                ensure_ascii=False,
            ),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )


@app.function_name("update_reservation")
@app.route(
    route="reservations/{reservation_id}",
    methods=["PUT"],
    auth_level=func.AuthLevel.ANONYMOUS,
)
async def update_reservation(req: func.HttpRequest) -> func.HttpResponse:
    """
    予約更新API
    Path Parameter: reservation_id
    Request Body: 更新データ (notes, status)
    """
    try:
        reservation_id = req.route_params.get("reservation_id")

        if not reservation_id:
            return func.HttpResponse(
                json.dumps(
                    {"status": "error", "message": "Reservation ID is required"},
                    ensure_ascii=False,
                ),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        # リクエストボディの解析
        req_body = req.get_json()
        if not req_body:
            return func.HttpResponse(
                json.dumps(
                    {"status": "error", "message": "Request body is required"},
                    ensure_ascii=False,
                ),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        storage_manager = StorageManager()
        updated_reservation = await storage_manager.update_reservation(
            reservation_id, req_body
        )

        if not updated_reservation:
            return func.HttpResponse(
                json.dumps(
                    {"status": "error", "message": "Reservation not found"},
                    ensure_ascii=False,
                ),
                status_code=404,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        logger.info(f"Updated reservation: {reservation_id}")

        return func.HttpResponse(
            json.dumps(
                {
                    "status": "success",
                    "message": "Reservation updated successfully",
                    "data": updated_reservation.to_dict(),
                },
                ensure_ascii=False,
            ),
            status_code=200,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )

    except Exception as e:
        logger.error(f"Error in update_reservation: {str(e)}")
        return func.HttpResponse(
            json.dumps(
                {
                    "status": "error",
                    "message": "Failed to update reservation",
                    "error": str(e),
                },
                ensure_ascii=False,
            ),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )


@app.function_name("cancel_reservation")
@app.route(
    route="reservations/{reservation_id}",
    methods=["DELETE"],
    auth_level=func.AuthLevel.ANONYMOUS,
)
async def cancel_reservation(req: func.HttpRequest) -> func.HttpResponse:
    """
    予約キャンセルAPI
    Path Parameter: reservation_id
    """
    try:
        reservation_id = req.route_params.get("reservation_id")

        if not reservation_id:
            return func.HttpResponse(
                json.dumps(
                    {"status": "error", "message": "Reservation ID is required"},
                    ensure_ascii=False,
                ),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        storage_manager = StorageManager()

        # 予約の存在確認とキャンセル可能性チェック
        reservation = await storage_manager.get_reservation_by_id(reservation_id)
        if not reservation:
            return func.HttpResponse(
                json.dumps(
                    {"status": "error", "message": "Reservation not found"},
                    ensure_ascii=False,
                ),
                status_code=404,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        if not reservation.can_cancel():
            return func.HttpResponse(
                json.dumps(
                    {
                        "status": "error",
                        "message": "Reservation cannot be cancelled",
                        "error": "キャンセル期限を過ぎています（レッスン開始24時間前まで）",
                    },
                    ensure_ascii=False,
                ),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

        # キャンセル実行
        success = await storage_manager.delete_reservation(reservation_id)

        if success:
            logger.info(f"Cancelled reservation: {reservation_id}")
            return func.HttpResponse(
                json.dumps(
                    {
                        "status": "success",
                        "message": "Reservation cancelled successfully",
                    },
                    ensure_ascii=False,
                ),
                status_code=200,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )
        else:
            return func.HttpResponse(
                json.dumps(
                    {"status": "error", "message": "Failed to cancel reservation"},
                    ensure_ascii=False,
                ),
                status_code=500,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

    except Exception as e:
        logger.error(f"Error in cancel_reservation: {str(e)}")
        return func.HttpResponse(
            json.dumps(
                {
                    "status": "error",
                    "message": "Failed to cancel reservation",
                    "error": str(e),
                },
                ensure_ascii=False,
            ),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )


@app.function_name("get_reservations_summary")
@app.route(
    route="reservations/summary", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS
)
async def get_reservations_summary(req: func.HttpRequest) -> func.HttpResponse:
    """
    予約統計情報取得API（管理者用）
    """
    try:
        storage_manager = StorageManager()
        summary = await storage_manager.get_reservations_summary()

        return func.HttpResponse(
            json.dumps({"status": "success", "data": summary}, ensure_ascii=False),
            status_code=200,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )

    except Exception as e:
        logger.error(f"Error in get_reservations_summary: {str(e)}")
        return func.HttpResponse(
            json.dumps(
                {
                    "status": "error",
                    "message": "Failed to retrieve summary",
                    "error": str(e),
                },
                ensure_ascii=False,
            ),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )
