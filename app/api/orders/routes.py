from flask import Blueprint, request, g
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from app.services.order.order_service import (
    create_order, get_order_by_id, get_user_orders, 
    update_order_status, process_checkout
)

# Criar blueprint
orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/", methods=["POST"])
@jwt_required
def create_order_route():
    """Cria um novo pedido."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        # Campos obrigatórios
        required_fields = ["ad_id"]
        for field in required_fields:
            if field not in data:
                return error_response(f"Campo '{field}' é obrigatório", status_code=400)

        result = create_order(g.user["_id"], data)

        if result["success"]:
            return success_response(
                data={"order": result["order"]},
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao criar pedido: {str(e)}")


@orders_bp.route("/checkout", methods=["POST"])
@jwt_required
def checkout_route():
    """Processa checkout do carrinho."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        # Campos obrigatórios
        required_fields = ["cart_items", "shipping_address"]
        for field in required_fields:
            if field not in data:
                return error_response(f"Campo '{field}' é obrigatório", status_code=400)

        result = process_checkout(
            g.user["_id"], 
            data["cart_items"], 
            data["shipping_address"],
            data.get("payment_method", "pending")
        )

        if result["success"]:
            return success_response(
                data=result,
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro no checkout: {str(e)}")


@orders_bp.route("/", methods=["GET"])
@jwt_required
def get_user_orders_route():
    """Retorna pedidos do usuário (como comprador ou vendedor)."""
    try:
        role = request.args.get("role", "all")  # all, buyer, seller
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))

        result = get_user_orders(g.user["_id"], role, limit, skip)

        if result["success"]:
            return success_response(
                data={"orders": result["orders"], "total": result["total"]},
                message="Pedidos encontrados com sucesso"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar pedidos: {str(e)}")


@orders_bp.route("/<order_id>", methods=["GET"])
@jwt_required
def get_order_details(order_id):
    """Retorna detalhes de um pedido específico."""
    try:
        result = get_order_by_id(order_id, g.user["_id"])

        if result["success"]:
            return success_response(
                data={"order": result["order"]},
                message="Pedido encontrado com sucesso"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        return error_response(f"Erro ao buscar pedido: {str(e)}")


@orders_bp.route("/<order_id>/status", methods=["PUT"])
@jwt_required
def update_order_status_route(order_id):
    """Atualiza status de um pedido."""
    try:
        data = request.json
        if not data or "status" not in data:
            return error_response("Status é obrigatório", status_code=400)

        new_status = data["status"]
        role = data.get("role")

        result = update_order_status(order_id, g.user["_id"], new_status, role)

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao atualizar status: {str(e)}")


@orders_bp.route("/stats", methods=["GET"])
@jwt_required
def get_order_stats():
    """Retorna estatísticas de pedidos do usuário."""
    try:
        from app.db.mongo_client import db
        from bson import ObjectId

        user_id = ObjectId(g.user["_id"])

        # Estatísticas como comprador
        buyer_stats = {
            "total": db.orders.count_documents({"buyer_id": user_id}),
            "pending": db.orders.count_documents({"buyer_id": user_id, "status": "pending"}),
            "paid": db.orders.count_documents({"buyer_id": user_id, "status": "paid"}),
            "shipped": db.orders.count_documents({"buyer_id": user_id, "status": "shipped"}),
            "delivered": db.orders.count_documents({"buyer_id": user_id, "status": "delivered"}),
            "cancelled": db.orders.count_documents({"buyer_id": user_id, "status": "cancelled"})
        }

        # Estatísticas como vendedor
        seller_stats = {
            "total": db.orders.count_documents({"seller_id": user_id}),
            "pending": db.orders.count_documents({"seller_id": user_id, "status": "pending"}),
            "paid": db.orders.count_documents({"seller_id": user_id, "status": "paid"}),
            "shipped": db.orders.count_documents({"seller_id": user_id, "status": "shipped"}),
            "delivered": db.orders.count_documents({"seller_id": user_id, "status": "delivered"}),
            "cancelled": db.orders.count_documents({"seller_id": user_id, "status": "cancelled"})
        }

        # Valor total vendido (pedidos delivered)
        seller_revenue_pipeline = [
            {"$match": {"seller_id": user_id, "status": "delivered"}},
            {"$group": {"_id": None, "total_revenue": {"$sum": "$total_price"}}}
        ]
        revenue_result = list(db.orders.aggregate(seller_revenue_pipeline))
        total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0

        # Valor total gasto (pedidos delivered)
        buyer_spent_pipeline = [
            {"$match": {"buyer_id": user_id, "status": "delivered"}},
            {"$group": {"_id": None, "total_spent": {"$sum": "$total_price"}}}
        ]
        spent_result = list(db.orders.aggregate(buyer_spent_pipeline))
        total_spent = spent_result[0]["total_spent"] if spent_result else 0

        return success_response(
            data={
                "buyer_stats": buyer_stats,
                "seller_stats": seller_stats,
                "total_revenue": total_revenue,
                "total_spent": total_spent
            },
            message="Estatísticas encontradas"
        )

    except Exception as e:
        return error_response(f"Erro ao buscar estatísticas: {str(e)}")


# Rotas específicas para vendedores
@orders_bp.route("/sales", methods=["GET"])
@jwt_required
def get_sales():
    """Retorna vendas do usuário (pedidos onde ele é o vendedor)."""
    try:
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))
        status = request.args.get("status")  # Filtro opcional por status

        result = get_user_orders(g.user["_id"], "seller", limit, skip)

        if result["success"]:
            # Filtrar por status se especificado
            orders = result["orders"]
            if status:
                orders = [order for order in orders if order["status"] == status]

            return success_response(
                data={"sales": orders, "total": len(orders)},
                message="Vendas encontradas com sucesso"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar vendas: {str(e)}")


# Rotas específicas para compradores
@orders_bp.route("/purchases", methods=["GET"])
@jwt_required
def get_purchases():
    """Retorna compras do usuário (pedidos onde ele é o comprador)."""
    try:
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))
        status = request.args.get("status")  # Filtro opcional por status

        result = get_user_orders(g.user["_id"], "buyer", limit, skip)

        if result["success"]:
            # Filtrar por status se especificado
            orders = result["orders"]
            if status:
                orders = [order for order in orders if order["status"] == status]

            return success_response(
                data={"purchases": orders, "total": len(orders)},
                message="Compras encontradas com sucesso"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar compras: {str(e)}")