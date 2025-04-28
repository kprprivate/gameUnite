from flask import Blueprint
from app.utils.helpers.response_helpers import success_response

# Criar blueprint
users_bp = Blueprint("users", __name__)

@users_bp.route("/profile", methods=["GET"])
def get_profile():
    """Retorna o perfil do usuário."""
    return success_response(message="Endpoint de perfil do usuário")
