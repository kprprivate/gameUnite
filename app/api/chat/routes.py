from flask import Blueprint
from app.utils.helpers.response_helpers import success_response

# Criar blueprint
chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/rooms", methods=["GET"])
def get_chat_rooms():
    """Lista as salas de chat do usuário."""
    return success_response(message="Endpoint de listagem de salas de chat")
