from flask import Blueprint
from app.utils.helpers.response_helpers import success_response

# Criar blueprint
search_bp = Blueprint("search", __name__)

@search_bp.route("/", methods=["GET"])
def search():
    """Pesquisa global na plataforma."""
    return success_response(message="Endpoint de pesquisa")
