from flask import Blueprint, request, g
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from app.services.cart.cart_service import (
    add_to_cart, get_user_cart, update_cart_item,
    remove_from_cart, clear_cart, validate_cart, get_cart_count
)

# Criar blueprint
cart_bp = Blueprint("cart", __name__)


@cart_bp.route("/", methods=["GET"])
@jwt_required
def get_cart():
    """Retorna o carrinho do usuário."""
    try:
        result = get_user_cart(g.user["_id"])

        if result["success"]:
            return success_response(
                data=result["data"],
                message="Carrinho carregado com sucesso"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao carregar carrinho: {str(e)}")


@cart_bp.route("/add", methods=["POST"])
@jwt_required
def add_to_cart_route():
    """Adiciona um item ao carrinho."""
    try:
        data = request.json
        if not data or "ad_id" not in data:
            return error_response("ID do anúncio é obrigatório", status_code=400)

        ad_id = data["ad_id"]
        quantity = data.get("quantity", 1)

        if quantity <= 0:
            return error_response("Quantidade deve ser maior que zero", status_code=400)

        result = add_to_cart(g.user["_id"], ad_id, quantity)

        if result["success"]:
            return success_response(
                data=result.get("data", {}),
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao adicionar ao carrinho: {str(e)}")


@cart_bp.route("/update/<ad_id>", methods=["PUT"])
@jwt_required
def update_cart_item_route(ad_id):
    """Atualiza a quantidade de um item no carrinho."""
    try:
        data = request.json
        if not data or "quantity" not in data:
            return error_response("Quantidade é obrigatória", status_code=400)

        quantity = data["quantity"]

        if quantity < 0:
            return error_response("Quantidade não pode ser negativa", status_code=400)

        result = update_cart_item(g.user["_id"], ad_id, quantity)

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao atualizar item: {str(e)}")


@cart_bp.route("/remove/<ad_id>", methods=["DELETE"])
@jwt_required
def remove_from_cart_route(ad_id):
    """Remove um item do carrinho."""
    try:
        result = remove_from_cart(g.user["_id"], ad_id)

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao remover item: {str(e)}")


@cart_bp.route("/clear", methods=["DELETE"])
@jwt_required
def clear_cart_route():
    """Limpa todo o carrinho."""
    try:
        result = clear_cart(g.user["_id"])

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao limpar carrinho: {str(e)}")


@cart_bp.route("/validate", methods=["GET"])
@jwt_required
def validate_cart_route():
    """Valida os itens do carrinho."""
    try:
        result = validate_cart(g.user["_id"])

        if result["success"]:
            return success_response(
                data=result["data"],
                message="Carrinho validado"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao validar carrinho: {str(e)}")


@cart_bp.route("/count", methods=["GET"])
@jwt_required
def get_cart_count_route():
    """Retorna o número de itens no carrinho."""
    try:
        result = get_cart_count(g.user["_id"])

        if result["success"]:
            return success_response(
                data={"count": result["count"]},
                message="Contagem do carrinho"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao contar itens: {str(e)}")