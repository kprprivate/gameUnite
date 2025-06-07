# app/api/orders/routes.py - VERSÃO CORRIGIDA
from flask import Blueprint, request, g
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from app.services.order.order_service import (
    create_order, get_order_by_id, get_user_orders,
    update_order_status_with_chat_notification, process_checkout
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
        print(f"Erro na rota create_order: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")


@orders_bp.route("/checkout", methods=["POST"])
@jwt_required
def checkout_route():
    """Processa checkout do carrinho."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        # Validar dados obrigatórios
        if "cart_items" not in data or not isinstance(data["cart_items"], list):
            return error_response("Lista de itens do carrinho é obrigatória", status_code=400)

        if len(data["cart_items"]) == 0:
            return error_response("Carrinho está vazio", status_code=400)

        if "shipping_address" not in data:
            return error_response("Endereço de entrega é obrigatório", status_code=400)

        # Validar endereço de entrega
        shipping_address = data["shipping_address"]
        required_address_fields = ["street", "number", "neighborhood", "city", "state", "zipcode"]

        for field in required_address_fields:
            if field not in shipping_address or not shipping_address[field]:
                return error_response(f"Campo de endereço '{field}' é obrigatório", status_code=400)

        # Validar cada item do carrinho
        for i, item in enumerate(data["cart_items"]):
            if "ad_id" not in item or not item["ad_id"]:
                return error_response(f"ID do anúncio é obrigatório para o item {i + 1}", status_code=400)

            if "quantity" not in item or not isinstance(item["quantity"], int) or item["quantity"] < 1:
                return error_response(f"Quantidade inválida para o item {i + 1}", status_code=400)

        result = process_checkout(
            g.user["_id"],
            data["cart_items"],
            shipping_address,
            data.get("payment_method", "pending")
        )

        if result["success"]:
            response_data = {
                "orders": result["orders"],
                "summary": result.get("summary", {}),
                "message": result["message"]
            }

            # Incluir falhas se houver
            if result.get("failed_orders"):
                response_data["failed_orders"] = result["failed_orders"]

            return success_response(
                data=response_data,
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        print(f"Erro na rota checkout: {str(e)}")
        return error_response(f"Erro interno no checkout: {str(e)}")


@orders_bp.route("/", methods=["GET"])
@jwt_required
def get_user_orders_route():
    """Retorna pedidos do usuário (como comprador ou vendedor)."""
    try:
        role = request.args.get("role", "all")  # all, buyer, seller
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))

        # Validar parâmetros
        if role not in ["all", "buyer", "seller"]:
            return error_response("Parâmetro 'role' deve ser 'all', 'buyer' ou 'seller'", status_code=400)

        limit = max(1, min(limit, 100))  # Entre 1 e 100
        skip = max(0, skip)

        result = get_user_orders(g.user["_id"], role, limit, skip)

        if result["success"]:
            return success_response(
                data={"orders": result["orders"], "total": result["total"]},
                message="Pedidos encontrados com sucesso"
            )
        else:
            return error_response(result["message"])

    except ValueError as e:
        return error_response("Parâmetros inválidos", status_code=400)
    except Exception as e:
        print(f"Erro na rota get_user_orders: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")


@orders_bp.route("/<order_id>", methods=["GET"])
@jwt_required
def get_order_details(order_id):
    """Retorna detalhes de um pedido específico."""
    try:
        if not order_id:
            return error_response("ID do pedido é obrigatório", status_code=400)

        result = get_order_by_id(order_id, g.user["_id"])

        if result["success"]:
            return success_response(
                data={"order": result["order"]},
                message="Pedido encontrado com sucesso"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        print(f"Erro na rota get_order_details: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")


@orders_bp.route("/<order_id>/status", methods=["PUT"])
@jwt_required
def update_order_status_route(order_id):
    """Atualiza status de um pedido."""
    try:
        if not order_id:
            return error_response("ID do pedido é obrigatório", status_code=400)

        data = request.json
        if not data or "status" not in data:
            return error_response("Status é obrigatório", status_code=400)

        new_status = data["status"]
        role = data.get("role")

        # Validar status
        valid_statuses = ["pending", "paid", "shipped", "delivered", "cancelled"]
        if new_status not in valid_statuses:
            return error_response(f"Status inválido. Deve ser um dos: {', '.join(valid_statuses)}", status_code=400)

        result = update_order_status_with_chat_notification(order_id, g.user["_id"], new_status, role)

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        print(f"Erro na rota update_order_status: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")


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
                "total_revenue": float(total_revenue),
                "total_spent": float(total_spent)
            },
            message="Estatísticas encontradas"
        )

    except Exception as e:
        print(f"Erro na rota get_order_stats: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")


# Rotas específicas para vendedores
@orders_bp.route("/sales", methods=["GET"])
@jwt_required
def get_sales():
    """Retorna vendas do usuário (pedidos onde ele é o vendedor)."""
    try:
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))
        status = request.args.get("status")  # Filtro opcional por status

        # Validar parâmetros
        limit = max(1, min(limit, 100))
        skip = max(0, skip)

        result = get_user_orders(g.user["_id"], "seller", limit, skip)

        if result["success"]:
            orders = result["orders"]

            # Filtrar por status se especificado
            if status:
                valid_statuses = ["pending", "paid", "shipped", "delivered", "cancelled"]
                if status in valid_statuses:
                    orders = [order for order in orders if order["status"] == status]

            return success_response(
                data={"sales": orders, "total": len(orders)},
                message="Vendas encontradas com sucesso"
            )
        else:
            return error_response(result["message"])

    except ValueError:
        return error_response("Parâmetros inválidos", status_code=400)
    except Exception as e:
        print(f"Erro na rota get_sales: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")


# Rotas específicas para compradores
@orders_bp.route("/purchases", methods=["GET"])
@jwt_required
def get_purchases():
    """Retorna compras do usuário (pedidos onde ele é o comprador)."""
    try:
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))
        status = request.args.get("status")  # Filtro opcional por status

        # Validar parâmetros
        limit = max(1, min(limit, 100))
        skip = max(0, skip)

        result = get_user_orders(g.user["_id"], "buyer", limit, skip)

        if result["success"]:
            orders = result["orders"]

            # Filtrar por status se especificado
            if status:
                valid_statuses = ["pending", "paid", "shipped", "delivered", "cancelled"]
                if status in valid_statuses:
                    orders = [order for order in orders if order["status"] == status]

            return success_response(
                data={"purchases": orders, "total": len(orders)},
                message="Compras encontradas com sucesso"
            )
        else:
            return error_response(result["message"])

    except ValueError:
        return error_response("Parâmetros inválidos", status_code=400)
    except Exception as e:
        print(f"Erro na rota get_purchases: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")


# Rota para obter resumo de um pedido específico (usado em notificações, etc)
@orders_bp.route("/<order_id>/summary", methods=["GET"])
@jwt_required
def get_order_summary(order_id):
    """Retorna resumo de um pedido específico."""
    try:
        if not order_id:
            return error_response("ID do pedido é obrigatório", status_code=400)

        result = get_order_by_id(order_id, g.user["_id"])

        if result["success"]:
            order = result["order"]

            # Criar resumo simplificado
            summary = {
                "_id": order["_id"],
                "status": order["status"],
                "total_price": order["total_price"],
                "quantity": order["quantity"],
                "ad_title": order["ad_snapshot"]["title"],
                "game_name": order["ad_snapshot"]["game_name"],
                "role": order["role"],
                "other_user": order["other_user"]["username"] if order["other_user"] else None,
                "created_at": order["created_at"],
                "updated_at": order["updated_at"]
            }

            return success_response(
                data={"summary": summary},
                message="Resumo do pedido encontrado"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        print(f"Erro na rota get_order_summary: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")


# Rota para cancelar pedido
@orders_bp.route("/<order_id>/cancel", methods=["POST"])
@jwt_required
def cancel_order(order_id):
    """Cancela um pedido específico."""
    try:
        if not order_id:
            return error_response("ID do pedido é obrigatório", status_code=400)

        # Obter dados opcionais
        data = request.json or {}
        reason = data.get("reason", "Cancelado pelo usuário")

        result = update_order_status_with_chat_notification(order_id, g.user["_id"], "cancelled")

        if result["success"]:
            # Aqui você poderia adicionar lógica adicional como:
            # - Registrar motivo do cancelamento
            # - Enviar notificações
            # - Reverter estoque se aplicável

            return success_response(
                message=f"Pedido cancelado com sucesso. {result['message']}"
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        print(f"Erro na rota cancel_order: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")


# Rota para validar carrinho antes do checkout (opcional, para UX)
@orders_bp.route("/validate-cart", methods=["POST"])
@jwt_required
def validate_cart():
    """Valida itens do carrinho antes do checkout."""
    try:
        data = request.json
        if not data or "cart_items" not in data:
            return error_response("Lista de itens do carrinho é obrigatória", status_code=400)

        cart_items = data["cart_items"]
        if not isinstance(cart_items, list) or len(cart_items) == 0:
            return error_response("Carrinho está vazio", status_code=400)

        validation_results = []
        valid_items = []
        invalid_items = []

        from app.db.mongo_client import db
        from bson import ObjectId

        for item in cart_items:
            try:
                ad_id = item.get("ad_id")
                if not ad_id:
                    invalid_items.append({
                        "item": item,
                        "error": "ID do anúncio não fornecido"
                    })
                    continue

                # Verificar se anúncio existe e está ativo
                ad = db.ads.find_one({
                    "_id": ObjectId(ad_id),
                    "status": "active",
                    "ad_type": "venda"
                })

                if not ad:
                    invalid_items.append({
                        "item": item,
                        "error": "Anúncio não encontrado, inativo ou não é de venda"
                    })
                    continue

                # Verificar se não é próprio anúncio
                if str(ad["user_id"]) == str(g.user["_id"]):
                    invalid_items.append({
                        "item": item,
                        "error": "Você não pode comprar seu próprio anúncio"
                    })
                    continue

                # Verificar preço
                if not ad.get("price_per_hour") or ad["price_per_hour"] <= 0:
                    invalid_items.append({
                        "item": item,
                        "error": "Anúncio sem preço válido"
                    })
                    continue

                valid_items.append({
                    "ad_id": ad_id,
                    "title": ad["title"],
                    "price": ad["price_per_hour"],
                    "quantity": item.get("quantity", 1)
                })

            except Exception as item_error:
                invalid_items.append({
                    "item": item,
                    "error": f"Erro ao validar item: {str(item_error)}"
                })

        is_valid = len(invalid_items) == 0
        total_items = len(cart_items)
        valid_count = len(valid_items)

        return success_response(
            data={
                "is_valid": is_valid,
                "total_items": total_items,
                "valid_items": valid_count,
                "invalid_items": len(invalid_items),
                "valid_items_data": valid_items,
                "invalid_items_data": invalid_items,
                "can_proceed": is_valid and valid_count > 0
            },
            message=f"Validação concluída: {valid_count}/{total_items} itens válidos"
        )

    except Exception as e:
        print(f"Erro na rota validate_cart: {str(e)}")
        return error_response(f"Erro interno: {str(e)}")