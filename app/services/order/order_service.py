# app/services/order/order_service.py - VERSÃO CORRIGIDA
from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id


def create_order(buyer_id, order_data):
    """Cria um novo pedido."""
    try:
        # Validar dados de entrada
        if not order_data.get("ad_id"):
            return {"success": False, "message": "ID do anúncio é obrigatório"}

        # Verificar se o anúncio existe e está ativo
        try:
            ad_object_id = ObjectId(order_data["ad_id"])
        except:
            return {"success": False, "message": "ID do anúncio inválido"}

        ad = db.ads.find_one({
            "_id": ad_object_id,
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

        # Validar quantidade
        quantity = order_data.get("quantity", 1)
        if not isinstance(quantity, int) or quantity < 1:
            return {"success": False, "message": "Quantidade deve ser um número positivo"}

        # Calcular valores
        unit_price = ad.get("price_per_hour", 0)
        if unit_price <= 0:
            return {"success": False, "message": "Anúncio sem preço válido"}

        total_price = unit_price * quantity

        # Buscar dados do jogo
        game = db.games.find_one({"_id": ad["game_id"]})

        # Buscar dados do vendedor
        seller = get_user_by_id(str(ad["user_id"]))

        # Criar pedido
        now = datetime.utcnow()
        order = {
            "buyer_id": ObjectId(buyer_id),
            "seller_id": ad["user_id"],
            "ad_id": ad_object_id,
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
                "platform": ad.get("platform", ""),
                "condition": ad.get("condition", ""),
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
        print(f"Erro ao criar pedido: {str(e)}")
        return {"success": False, "message": f"Erro interno ao criar pedido: {str(e)}"}


def process_checkout(user_id, cart_items, shipping_address, payment_method="pending"):
    """Processa checkout criando múltiplos pedidos se necessário."""
    try:
        # Validar dados de entrada
        if not cart_items or len(cart_items) == 0:
            return {"success": False, "message": "Carrinho vazio"}

        if not shipping_address:
            return {"success": False, "message": "Endereço de entrega é obrigatório"}

        created_orders = []
        failed_orders = []

        for item in cart_items:
            try:
                # Validar item do carrinho
                if not item.get("ad_id"):
                    failed_orders.append({
                        "error": "ID do anúncio não fornecido",
                        "item": item
                    })
                    continue

                # Preparar dados do pedido
                order_data = {
                    "ad_id": item["ad_id"],
                    "quantity": item.get("quantity", 1),
                    "shipping_address": shipping_address,
                    "notes": item.get("notes", f"Pedido via carrinho - {item.get('title', 'Item')}")
                }

                # Criar pedido
                result = create_order(user_id, order_data)

                if result["success"]:
                    created_orders.append(result["order"])
                else:
                    failed_orders.append({
                        "error": result["message"],
                        "ad_id": item["ad_id"],
                        "title": item.get("title", "Item não identificado")
                    })

            except Exception as item_error:
                print(f"Erro ao processar item do carrinho: {str(item_error)}")
                failed_orders.append({
                    "error": f"Erro interno: {str(item_error)}",
                    "item": item
                })

        # Determinar o resultado
        total_items = len(cart_items)
        successful_orders = len(created_orders)
        failed_items = len(failed_orders)

        if successful_orders == 0:
            return {
                "success": False,
                "message": "Nenhum pedido pôde ser criado",
                "failed_orders": failed_orders
            }

        message = f"{successful_orders} pedido(s) criado(s) com sucesso"
        if failed_items > 0:
            message += f", {failed_items} item(ns) falharam"

        return {
            "success": True,
            "message": message,
            "orders": created_orders,
            "failed_orders": failed_orders if failed_items > 0 else [],
            "summary": {
                "total_items": total_items,
                "successful_orders": successful_orders,
                "failed_items": failed_items
            }
        }

    except Exception as e:
        print(f"Erro no checkout: {str(e)}")
        return {"success": False, "message": f"Erro interno no checkout: {str(e)}"}


def get_order_by_id(order_id, user_id=None):
    """Busca um pedido específico."""
    try:
        # Validar ID do pedido
        try:
            order_object_id = ObjectId(order_id)
        except:
            return {"success": False, "message": "ID do pedido inválido"}

        order = db.orders.find_one({"_id": order_object_id})
        if not order:
            return {"success": False, "message": "Pedido não encontrado"}

        # Verificar se o usuário tem permissão para ver o pedido
        if user_id and str(order["buyer_id"]) != str(user_id) and str(order["seller_id"]) != str(user_id):
            return {"success": False, "message": "Acesso negado"}

        # Buscar dados do comprador e vendedor
        buyer = get_user_by_id(str(order["buyer_id"]))
        seller = get_user_by_id(str(order["seller_id"]))

        # Determinar o papel do usuário atual
        user_role = None
        other_user = None
        if user_id:
            if str(order["buyer_id"]) == str(user_id):
                user_role = "buyer"
                other_user = seller
            elif str(order["seller_id"]) == str(user_id):
                user_role = "seller"
                other_user = buyer

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
            "role": user_role,
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
            } if seller else None,
            "other_user": other_user
        }

        return {"success": True, "order": order_data}

    except Exception as e:
        print(f"Erro ao buscar pedido: {str(e)}")
        return {"success": False, "message": f"Erro interno ao buscar pedido: {str(e)}"}


def get_user_orders(user_id, role="all", limit=20, skip=0):
    """Busca pedidos do usuário (como comprador ou vendedor)."""
    try:
        # Validar parâmetros
        limit = max(1, min(limit, 100))  # Entre 1 e 100
        skip = max(0, skip)

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
            try:
                # Buscar dados do comprador e vendedor
                buyer = get_user_by_id(str(order["buyer_id"]))
                seller = get_user_by_id(str(order["seller_id"]))

                # Determinar papel e outro usuário
                user_role = "buyer" if str(order["buyer_id"]) == str(user_id) else "seller"
                other_user = seller if user_role == "buyer" else buyer

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
                    "role": user_role,
                    "other_user": {
                        "_id": other_user["_id"],
                        "username": other_user["username"],
                        "first_name": other_user.get("first_name", ""),
                        "last_name": other_user.get("last_name", ""),
                        "profile_pic": other_user.get("profile_pic", "")
                    } if other_user else None
                }

                orders.append(order_data)

            except Exception as order_error:
                print(f"Erro ao processar pedido {order.get('_id')}: {str(order_error)}")
                continue

        # Contar total
        total = db.orders.count_documents(query)

        return {
            "success": True,
            "orders": orders,
            "total": total
        }

    except Exception as e:
        print(f"Erro ao buscar pedidos: {str(e)}")
        return {"success": False, "message": f"Erro interno ao buscar pedidos: {str(e)}"}


def update_order_status(order_id, user_id, new_status, role=None):
    """Atualiza status do pedido."""
    try:
        # Validar ID do pedido
        try:
            order_object_id = ObjectId(order_id)
        except:
            return {"success": False, "message": "ID do pedido inválido"}

        order = db.orders.find_one({"_id": order_object_id})
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
            {"_id": order_object_id},
            {"$set": update_data}
        )

        return {"success": True, "message": f"Status atualizado para {new_status}"}

    except Exception as e:
        print(f"Erro ao atualizar status: {str(e)}")
        return {"success": False, "message": f"Erro interno ao atualizar status: {str(e)}"}