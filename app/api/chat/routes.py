from flask import Blueprint, request, g
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from app.services.chat.chat_service import (
    get_chat_room, get_chat_messages, send_message,
    get_user_chat_rooms, send_system_message
)

# Criar blueprint
chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/rooms", methods=["GET"])
@jwt_required
def get_user_rooms():
    """Lista as salas de chat do usuário."""
    try:
        result = get_user_chat_rooms(g.user["_id"])

        if result["success"]:
            return success_response(
                data=result["data"],
                message="Salas de chat encontradas"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar salas: {str(e)}")


@chat_bp.route("/room/<order_id>", methods=["GET"])
@jwt_required
def get_order_chat_room(order_id):
    """Busca a sala de chat de um pedido."""
    try:
        result = get_chat_room(order_id, g.user["_id"])

        if result["success"]:
            return success_response(
                data=result["data"],
                message="Sala de chat encontrada"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        return error_response(f"Erro ao buscar sala: {str(e)}")


@chat_bp.route("/room/<room_id>/messages", methods=["GET"])
@jwt_required
def get_room_messages(room_id):
    """Busca mensagens de uma sala."""
    try:
        limit = int(request.args.get("limit", 50))
        skip = int(request.args.get("skip", 0))

        result = get_chat_messages(room_id, g.user["_id"], limit, skip)

        if result["success"]:
            return success_response(
                data=result["data"],
                message="Mensagens encontradas"
            )
        else:
            return error_response(result["message"], status_code=403)

    except Exception as e:
        return error_response(f"Erro ao buscar mensagens: {str(e)}")


@chat_bp.route("/room/<room_id>/message", methods=["POST"])
@jwt_required
def send_message_route(room_id):
    """Envia uma mensagem para a sala."""
    try:
        data = request.json
        if not data or "content" not in data:
            return error_response("Conteúdo da mensagem é obrigatório", status_code=400)

        content = data["content"].strip()
        if not content:
            return error_response("Mensagem não pode estar vazia", status_code=400)

        result = send_message(room_id, g.user["_id"], content)

        if result["success"]:
            # Emitir via WebSocket
            from app.extensions import socketio
            socketio.emit('new_message', {
                'message': result["data"]["message"]
            }, room=room_id)

            # Enviar notificação para o outro usuário na conversa
            from app.services.notification.notification_service import notify_new_chat_message
            try:
                notify_new_chat_message(room_id, g.user["_id"], content)
            except Exception as e:
                print(f"Erro ao enviar notificação de chat: {e}")

            return success_response(
                data=result["data"],
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao enviar mensagem: {str(e)}")


@chat_bp.route("/room/<room_id>/read", methods=["PATCH"])
@jwt_required
def mark_room_as_read(room_id):
    """Marca mensagens da sala como lidas."""
    try:
        from app.services.chat.chat_service import mark_messages_as_read
        result = mark_messages_as_read(room_id, g.user["_id"])

        if result["success"]:
            return success_response(
                data=result.get("data", {}),
                message="Mensagens marcadas como lidas"
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao marcar como lidas: {str(e)}")


@chat_bp.route("/room/<room_id>", methods=["DELETE"])
@jwt_required
def delete_chat_room(room_id):
    """Remove uma sala de chat."""
    try:
        from app.services.chat.chat_service import delete_chat_room
        result = delete_chat_room(room_id, g.user["_id"])

        if result["success"]:
            return success_response(
                message="Sala de chat removida"
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao remover sala: {str(e)}")