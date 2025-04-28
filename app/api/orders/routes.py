from flask import Blueprint
from app.utils.helpers.response_helpers import success_response

# Criar blueprint
orders_bp = Blueprint("orders", __name__)

@orders_bp.route("/", methods=["GET"])
def get_orders():
    """Lista os pedidos."""
    return success_response(message="Endpoint de listagem de pedidos")
