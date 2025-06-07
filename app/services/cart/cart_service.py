from datetime import datetime, timedelta
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id


def add_to_cart(user_id, ad_id, quantity=1):
    """Adiciona um item ao carrinho na database."""
    try:
        # Verificar se o anúncio existe e está ativo
        ad = db.ads.find_one({
            "_id": ObjectId(ad_id),
            "status": "active",
            "ad_type": "venda"
        })

        if not ad:
            return {"success": False, "message": "Anúncio não encontrado ou não disponível para venda"}

        # Verificar se não é o próprio anúncio
        if str(ad["user_id"]) == str(user_id):
            return {"success": False, "message": "Você não pode adicionar seu próprio anúncio ao carrinho"}

        # Verificar se já existe no carrinho
        existing_item = db.cart.find_one({
            "user_id": ObjectId(user_id),
            "ad_id": ObjectId(ad_id)
        })

        if existing_item:
            # Atualizar quantidade
            new_quantity = existing_item["quantity"] + quantity
            db.cart.update_one(
                {"_id": existing_item["_id"]},
                {
                    "$set": {
                        "quantity": new_quantity,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return {"success": True, "message": "Quantidade atualizada no carrinho"}

        # Buscar dados do jogo
        game = db.games.find_one({"_id": ad["game_id"]})

        # Buscar dados do vendedor
        seller = get_user_by_id(str(ad["user_id"]))

        # Criar item do carrinho
        cart_item = {
            "user_id": ObjectId(user_id),
            "ad_id": ObjectId(ad_id),
            "quantity": quantity,
            "price_snapshot": ad.get("price_per_hour", 0),
            "ad_snapshot": {
                "title": ad["title"],
                "game_name": game["name"] if game else "Jogo não encontrado",
                "platform": ad["platform"],
                "condition": ad["condition"],
                "image_url": ad.get("image_url", ""),
                "seller_username": seller["username"] if seller else "Vendedor",
                "seller_id": str(ad["user_id"])
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)
        }

        result = db.cart.insert_one(cart_item)
        cart_item["_id"] = str(result.inserted_id)
        cart_item["user_id"] = str(cart_item["user_id"])
        cart_item["ad_id"] = str(cart_item["ad_id"])

        return {
            "success": True,
            "message": "Item adicionado ao carrinho",
            "data": {"cart_item": cart_item}
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao adicionar ao carrinho: {str(e)}"}


def get_user_cart(user_id):
    """Busca o carrinho do usuário."""
    try:
        # Limpar itens expirados
        db.cart.delete_many({"expires_at": {"$lt": datetime.utcnow()}})

        # Buscar itens do carrinho
        cart_items = list(db.cart.find({"user_id": ObjectId(user_id)}).sort("created_at", -1))

        # Converter ObjectIds para strings
        for item in cart_items:
            item["_id"] = str(item["_id"])
            item["user_id"] = str(item["user_id"])
            item["ad_id"] = str(item["ad_id"])

        # Calcular totais
        total_items = len(cart_items)
        total_price = sum(item["price_snapshot"] * item["quantity"] for item in cart_items)

        return {
            "success": True,
            "data": {
                "items": cart_items,
                "total_items": total_items,
                "total_price": total_price
            }
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar carrinho: {str(e)}"}


def update_cart_item(user_id, ad_id, quantity):
    """Atualiza a quantidade de um item no carrinho."""
    try:
        if quantity <= 0:
            return remove_from_cart(user_id, ad_id)

        result = db.cart.update_one(
            {
                "user_id": ObjectId(user_id),
                "ad_id": ObjectId(ad_id)
            },
            {
                "$set": {
                    "quantity": quantity,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.modified_count > 0:
            return {"success": True, "message": "Quantidade atualizada"}
        else:
            return {"success": False, "message": "Item não encontrado no carrinho"}

    except Exception as e:
        return {"success": False, "message": f"Erro ao atualizar item: {str(e)}"}


def remove_from_cart(user_id, ad_id):
    """Remove um item do carrinho."""
    try:
        result = db.cart.delete_one({
            "user_id": ObjectId(user_id),
            "ad_id": ObjectId(ad_id)
        })

        if result.deleted_count > 0:
            return {"success": True, "message": "Item removido do carrinho"}
        else:
            return {"success": False, "message": "Item não encontrado no carrinho"}

    except Exception as e:
        return {"success": False, "message": f"Erro ao remover item: {str(e)}"}


def clear_cart(user_id):
    """Limpa todo o carrinho do usuário."""
    try:
        result = db.cart.delete_many({"user_id": ObjectId(user_id)})

        return {
            "success": True,
            "message": f"{result.deleted_count} itens removidos do carrinho"
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao limpar carrinho: {str(e)}"}


def validate_cart(user_id):
    """Valida se os itens do carrinho ainda estão disponíveis."""
    try:
        cart_result = get_user_cart(user_id)
        if not cart_result["success"]:
            return cart_result

        cart_items = cart_result["data"]["items"]
        valid_items = []
        invalid_items = []

        for item in cart_items:
            # Verificar se o anúncio ainda existe e está ativo
            ad = db.ads.find_one({
                "_id": ObjectId(item["ad_id"]),
                "status": "active",
                "ad_type": "venda"
            })

            if ad:
                # Verificar se o preço mudou
                current_price = ad.get("price_per_hour", 0)
                if current_price != item["price_snapshot"]:
                    item["price_changed"] = True
                    item["current_price"] = current_price

                valid_items.append(item)
            else:
                invalid_items.append(item)
                # Remover item inválido
                db.cart.delete_one({"_id": ObjectId(item["_id"])})

        return {
            "success": True,
            "data": {
                "valid_items": valid_items,
                "invalid_items": invalid_items,
                "total_valid": len(valid_items),
                "total_invalid": len(invalid_items)
            }
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao validar carrinho: {str(e)}"}


def get_cart_count(user_id):
    """Retorna o número de itens no carrinho."""
    try:
        # Limpar itens expirados
        db.cart.delete_many({"expires_at": {"$lt": datetime.utcnow()}})

        count = db.cart.count_documents({"user_id": ObjectId(user_id)})
        return {"success": True, "count": count}

    except Exception as e:
        return {"success": False, "message": f"Erro ao contar itens: {str(e)}"}