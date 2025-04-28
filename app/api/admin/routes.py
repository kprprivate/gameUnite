from flask import Blueprint
from app.utils.helpers.response_helpers import success_response

# Criar blueprint
admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    """Retorna dados do dashboard administrativo."""
    return success_response(message="Endpoint de dashboard administrativo")
