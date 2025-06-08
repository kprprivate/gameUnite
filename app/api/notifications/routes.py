from flask import Blueprint, request, g, jsonify
from app.services.notification.notification_service import (
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    delete_notification,
    create_report,
    get_reports
)
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from app.utils.decorators.permissions import admin_required

# Criar blueprint
notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("/", methods=["GET"])
@jwt_required
def get_notifications():
    """Busca notificações do usuário logado."""
    try:
        limit = min(int(request.args.get("limit", 20)), 100)
        skip = max(int(request.args.get("skip", 0)), 0)
        filter_type = request.args.get("filter")  # all, unread, read

        result = get_user_notifications(
            user_id=str(g.user["_id"]),
            limit=limit,
            skip=skip,
            filter_type=filter_type
        )

        if result["success"]:
            return success_response(
                data={
                    "notifications": result["notifications"],
                    "total": result["total"],
                    "unread_count": result["unread_count"]
                },
                message="Notificações encontradas"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar notificações: {str(e)}")

@notifications_bp.route("/<notification_id>/read", methods=["PUT"])
@jwt_required
def mark_notification_read(notification_id):
    """Marca uma notificação como lida."""
    try:
        result = mark_notification_as_read(notification_id, str(g.user["_id"]))

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao marcar notificação: {str(e)}")

@notifications_bp.route("/read-all", methods=["PUT"])
@jwt_required
def mark_all_read():
    """Marca todas as notificações como lidas."""
    try:
        result = mark_all_notifications_as_read(str(g.user["_id"]))

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao marcar todas as notificações: {str(e)}")

@notifications_bp.route("/<notification_id>", methods=["DELETE"])
@jwt_required
def delete_notification_route(notification_id):
    """Remove uma notificação."""
    try:
        result = delete_notification(notification_id, str(g.user["_id"]))

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao remover notificação: {str(e)}")

@notifications_bp.route("/reports", methods=["POST"])
@jwt_required
def create_report_route():
    """Cria um novo report."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        required_fields = ["reported_item_id", "reported_item_type", "reason"]
        for field in required_fields:
            if field not in data:
                return error_response(f"Campo '{field}' é obrigatório", status_code=400)

        result = create_report(
            reporter_id=str(g.user["_id"]),
            reported_item_id=data["reported_item_id"],
            reported_item_type=data["reported_item_type"],
            reason=data["reason"],
            details=data.get("details")
        )

        if result["success"]:
            return success_response(
                data={"report_id": result["report_id"]},
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao criar report: {str(e)}")

@notifications_bp.route("/reports", methods=["GET"])
@admin_required
def get_reports_route():
    """Busca reports para administradores."""
    try:
        limit = min(int(request.args.get("limit", 50)), 100)
        skip = max(int(request.args.get("skip", 0)), 0)
        status_filter = request.args.get("status")

        result = get_reports(
            limit=limit,
            skip=skip,
            status_filter=status_filter
        )

        if result["success"]:
            return success_response(
                data={
                    "reports": result["reports"],
                    "total": result["total"]
                },
                message="Reports encontrados"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar reports: {str(e)}")

@notifications_bp.route("/unread-count", methods=["GET"])
@jwt_required
def get_unread_count():
    """Retorna apenas o número de notificações não lidas."""
    try:
        result = get_user_notifications(
            user_id=str(g.user["_id"]),
            limit=1,  # Só precisamos do count
            skip=0
        )

        if result["success"]:
            return success_response(
                data={"unread_count": result["unread_count"]},
                message="Contador de não lidas"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar contador: {str(e)}")