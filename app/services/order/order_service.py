from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id


def create_order(buyer_id, order_data):
    """Cria um novo pedido."""
    try:
        # Verificar se o anúncio existe e está ativo
        ad = db.ads.find_one({
            "_id": ObjectId(order_data["ad_id"]),
            "status": "active"
        })

        if not ad:
            return {"success": False, "message": "Anúncio não encontrado ou inativo"}

        # Verificar se não é o próprio vendedor tentando comprar
        if str(ad["user_id"]) == str(buyer_id):
            return {"success": False, "message": "Você não pode comprar seu próprio anúncio"}

        # Verificar se o anúncio é do tipo venda
        if ad["ad_type"] != "venda":
            return {"success": False, "message": "Apenas anúncios de venda podem ser comprados"}

        # Calcular valores
        quantity = order_data.get("quantity", 1)
        unit_price = ad.get("price_per_hour", 0)
        total_price = unit_price * quantity

        # Buscar dados do jogo
        game = db.games.find_one({"_id": ad["game_id"]})

        # Criar pedido
        now = datetime.utcnow()
        order = {
            "buyer_id": ObjectId(buyer_id),
            "seller_id": ad["user_id"],
            "ad_id": ObjectId(order_data["ad_id"]),
            "game_id": ad["game_id"],
            "quantity": quantity,
            "unit_price": unit_price,
            "total_price": total_price,
            "status": "pending",  # pending, paid, shipped, delivered, cancelled, refunded
            "payment_status": "pending",  # pending, paid, failed, refunded
            "shipping_address": order_data.get("shipping_address"),
            "notes": order_data.get("notes", ""),
            "created_at": now,
            "updated_at": now,
            "expires_at": datetime.fromtimestamp(now.timestamp() + 24 * 60 * 60),  # 24h para pagar

            # Dados do anúncio (snapshot)
            "ad_snapshot": {
                "title": ad["title"],
                "description": ad["description"],
                "platform": ad["platform"],
                "condition": ad["condition"],
                "image_url": ad.get("image_url"),
                "game_name": game["name"] if game else "Jogo não encontrado"
            }
        }

        result = db.orders.insert_one(order)
        order["_id"] = str(result.inserted_id)
        order["buyer_id"] = str(order["buyer_id"])
        order["seller_id"] = str(order["seller_id"])
        order["ad_id"] = str(order["ad_id"])
        order["game_id"] = str(order["game_id"])

        return {
            "success": True,
            "message": "Pedido criado com sucesso",
            "order": order
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao criar pedido: {str(e)}"}


def get_order_by_id(order_id, user_id=None):
    """Busca um pedido específico."""
    try:
        order = db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            return {"success": False, "message": "Pedido não encontrado"}

        # Verificar se o usuário tem permissão para ver o pedido
        if user_id and str(order["buyer_id"]) != str(user_id) and str(order["seller_id"]) != str(user_id):
            return {"success": False, "message": "Acesso negado"}

        # Buscar dados do comprador e vendedor
        buyer = get_user_by_id(str(order["buyer_id"]))
        seller = get_user_by_id(str(order["seller_id"]))

        # Formatar pedido
        order_data = {
            "_id": str(order["_id"]),
            "buyer_id": str(order["buyer_id"]),
            "seller_id": str(order["seller_id"]),
            "ad_id": str(order["ad_id"]),
            "game_id": str(order["game_id"]),
            "quantity": order["quantity"],
            "unit_price": order["unit_price"],
            "total_price": order["total_price"],
            "status": order["status"],
            "payment_status": order["payment_status"],
            "shipping_address": order.get("shipping_address"),
            "notes": order.get("notes", ""),
            "created_at": order["created_at"].isoformat(),
            "updated_at": order["updated_at"].isoformat(),
            "expires_at": order.get("expires_at").isoformat() if order.get("expires_at") else None,
            "ad_snapshot": order["ad_snapshot"],
            "buyer": {
                "_id": buyer["_id"],
                "username": buyer["username"],
                "first_name": buyer.get("first_name", ""),
                "last_name": buyer.get("last_name", ""),
                "profile_pic": buyer.get("profile_pic", "")
            } if buyer else None,
            "seller": {
                "_id": seller["_id"],
                "username": seller["username"],
                "first_name": seller.get("first_name", ""),
                "last_name": seller.get("last_name", ""),
                "profile_pic": seller.get("profile_pic", ""),
                "seller_rating": seller.get("seller_rating", 0)
            } if seller else None
        }

        return {"success": True, "order": order_data}

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar pedido: {str(e)}"}


def get_user_orders(user_id, role="all", limit=20, skip=0):
    """Busca pedidos do usuário (como comprador ou vendedor)."""
    try:
        # Construir query baseado no papel
        if role == "buyer":
            query = {"buyer_id": ObjectId(user_id)}
        elif role == "seller":
            query = {"seller_id": ObjectId(user_id)}
        else:  # all
            query = {
                "$or": [
                    {"buyer_id": ObjectId(user_id)},
                    {"seller_id": ObjectId(user_id)}
                ]
            }

        # Buscar pedidos
        orders_cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
        orders = []

        for order in orders_cursor:
            # Buscar dados do comprador e vendedor
            buyer = get_user_by_id(str(order["buyer_id"]))
            seller = get_user_by_id(str(order["seller_id"]))

            order_data = {
                "_id": str(order["_id"]),
                "buyer_id": str(order["buyer_id"]),
                "seller_id": str(order["seller_id"]),
                "ad_id": str(order["ad_id"]),
                "quantity": order["quantity"],
                "unit_price": order["unit_price"],
                "total_price": order["total_price"],
                "status": order["status"],
                "payment_status": order["payment_status"],
                "created_at": order["created_at"].isoformat(),
                "updated_at": order["updated_at"].isoformat(),
                "expires_at": order.get("expires_at").isoformat() if order.get("expires_at") else None,
                "ad_snapshot": order["ad_snapshot"],
                "role": "buyer" if str(order["buyer_id"]) == str(user_id) else "seller",
                "other_user": seller if str(order["buyer_id"]) == str(user_id) else buyer
            }

            orders.append(order_data)

        # Contar total
        total = db.orders.count_documents(query)

        return {
            "success": True,
            "orders": orders,
            "total": total
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar pedidos: {str(e)}"}


def update_order_status(order_id, user_id, new_status, role=None):
    """Atualiza status do pedido."""
    try:
        order = db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            return {"success": False, "message": "Pedido não encontrado"}

        # Verificar permissões
        is_buyer = str(order["buyer_id"]) == str(user_id)
        is_seller = str(order["seller_id"]) == str(user_id)

        if not (is_buyer or is_seller):
            return {"success": False, "message": "Acesso negado"}

        # Validar transições de status
        current_status = order["status"]
        valid_transitions = {
            "pending": ["paid", "cancelled"],
            "paid": ["shipped", "cancelled"],
            "shipped": ["delivered", "cancelled"],
            "delivered": [],  # Status final
            "cancelled": []  # Status final
        }

        if new_status not in valid_transitions.get(current_status, []):
            return {"success": False, "message": f"Transição de status inválida: {current_status} -> {new_status}"}

        # Verificar quem pode fazer cada transição
        if new_status == "paid" and not is_buyer:
            return {"success": False, "message": "Apenas o comprador pode marcar como pago"}

        if new_status == "shipped" and not is_seller:
            return {"success": False, "message": "Apenas o vendedor pode marcar como enviado"}

        if new_status == "delivered" and not is_buyer:
            return {"success": False, "message": "Apenas o comprador pode confirmar entrega"}

        # Atualizar status
        update_data = {
            "status": new_status,
            "updated_at": datetime.utcnow()
        }

        # Atualizar payment_status se necessário
        if new_status == "paid":
            update_data["payment_status"] = "paid"
        elif new_status == "cancelled":
            update_data["payment_status"] = "cancelled"

        db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_data}
        )

        return {"success": True, "message": f"Status atualizado para {new_status}"}

    except Exception as e:
        return {"success": False, "message": f"Erro ao atualizar status: {str(e)}"}


def get_cart_items(user_id):
    """Busca itens do carrinho (implementação simples usando session/localStorage no frontend)."""
    # Por enquanto, vamos usar uma abordagem simples onde o carrinho é gerenciado no frontend
    # Em uma implementação mais robusta, poderia ser armazenado no banco de dados
    return {"success": True, "items": []}


def process_checkout(user_id, cart_items, shipping_address, payment_method="pending"):
    """Processa checkout criando múltiplos pedidos se necessário."""
    try:
        if not cart_items or len(cart_items) == 0:
            return {"success": False, "message": "Carrinho vazio"}

        created_orders = []

        for item in cart_items:
            order_data = {
                "ad_id": item["ad_id"],
                "quantity": item.get("quantity", 1),
                "shipping_address": shipping_address,
                "notes": item.get("notes", "")
            }

            result = create_order(user_id, order_data)
            if result["success"]:
                created_orders.append(result["order"])
            else:
                # Se algum pedido falhar, você pode decidir reverter todos ou continuar
                # Por enquanto, vamos continuar e reportar erros individuais
                created_orders.append({
                    "error": result["message"],
                    "ad_id": item["ad_id"]
                })

        return {
            "success": True,
            "message": f"{len(created_orders)} pedidos processados",
            "orders": created_orders
        }

    except Exception as e:
        return {"success": False, "message": f"Erro no checkout: {str(e)}"}