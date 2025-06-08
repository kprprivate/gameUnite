from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id
from app.services.notification.notification_service import notify_ad_favorited


def add_to_favorites(user_id, ad_id):
    """Adiciona um anúncio aos favoritos do usuário."""
    try:
        # Verificar se o anúncio existe
        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Verificar se já está nos favoritos
        existing_favorite = db.favorites.find_one({
            "user_id": ObjectId(user_id),
            "ad_id": ObjectId(ad_id)
        })

        if existing_favorite:
            return {"success": False, "message": "Anúncio já está nos favoritos"}

        # Adicionar aos favoritos
        favorite = {
            "user_id": ObjectId(user_id),
            "ad_id": ObjectId(ad_id),
            "created_at": datetime.utcnow()
        }

        result = db.favorites.insert_one(favorite)
        favorite["_id"] = str(result.inserted_id)
        favorite["user_id"] = str(favorite["user_id"])
        favorite["ad_id"] = str(favorite["ad_id"])

        # Criar notificação para o dono do anúncio (apenas se não for o próprio usuário)
        if str(ad["user_id"]) != str(user_id):
            try:
                user = get_user_by_id(str(user_id))
                favoriter_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() if user else "Usuário"
                if not favoriter_name:
                    favoriter_name = user.get('username', 'Usuário') if user else "Usuário"
                
                notify_ad_favorited(
                    ad_owner_id=str(ad["user_id"]),
                    favoriter_name=favoriter_name,
                    ad_title=ad.get("title", "Anúncio")
                )
            except Exception as notif_error:
                print(f"⚠️ Erro ao criar notificação de favorito: {notif_error}")

        return {
            "success": True,
            "message": "Anúncio adicionado aos favoritos",
            "data": {"favorite": favorite}
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao adicionar favorito: {str(e)}"}


def remove_from_favorites(user_id, ad_id):
    """Remove um anúncio dos favoritos do usuário."""
    try:
        result = db.favorites.delete_one({
            "user_id": ObjectId(user_id),
            "ad_id": ObjectId(ad_id)
        })

        if result.deleted_count > 0:
            return {"success": True, "message": "Anúncio removido dos favoritos"}
        else:
            return {"success": False, "message": "Favorito não encontrado"}

    except Exception as e:
        return {"success": False, "message": f"Erro ao remover favorito: {str(e)}"}


def get_user_favorites(user_id, limit=20, skip=0):
    """Busca os favoritos do usuário com detalhes dos anúncios."""
    try:
        # Pipeline de agregação para buscar favoritos com dados dos anúncios
        pipeline = [
            {"$match": {"user_id": ObjectId(user_id)}},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "ads",
                    "localField": "ad_id",
                    "foreignField": "_id",
                    "as": "ad"
                }
            },
            {"$unwind": "$ad"},
            {
                "$lookup": {
                    "from": "games",
                    "localField": "ad.game_id",
                    "foreignField": "_id",
                    "as": "game"
                }
            },
            {
                "$addFields": {
                    "ad.game": {"$arrayElemAt": ["$game", 0]}
                }
            },
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "user_id": {"$toString": "$user_id"},
                    "ad_id": {"$toString": "$ad_id"},
                    "created_at": 1,
                    "ad": {
                        "_id": {"$toString": "$ad._id"},
                        "title": 1,
                        "description": 1,
                        "ad_type": 1,
                        "platform": 1,
                        "condition": 1,
                        "price": "$ad.price_per_hour",
                        "image_url": 1,
                        "is_boosted": 1,
                        "view_count": 1,
                        "status": 1,
                        "created_at": 1,
                        "game": {
                            "_id": {"$toString": "$ad.game._id"},
                            "name": "$ad.game.name",
                            "image_url": "$ad.game.image_url"
                        }
                    }
                }
            }
        ]

        favorites_cursor = db.favorites.aggregate(pipeline)
        favorites = list(favorites_cursor)

        # Contar total de favoritos
        total_favorites = db.favorites.count_documents({"user_id": ObjectId(user_id)})

        return {
            "success": True,
            "data": {
                "favorites": favorites,
                "total": total_favorites,
                "limit": limit,
                "skip": skip
            }
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao buscar favoritos: {str(e)}"}


def is_ad_favorited(user_id, ad_id):
    """Verifica se um anúncio está nos favoritos do usuário."""
    try:
        favorite = db.favorites.find_one({
            "user_id": ObjectId(user_id),
            "ad_id": ObjectId(ad_id)
        })

        return {
            "success": True,
            "data": {"is_favorited": favorite is not None}
        }

    except Exception as e:
        return {"success": False, "message": f"Erro ao verificar favorito: {str(e)}"}


def toggle_favorite(user_id, ad_id):
    """Alterna favorito - adiciona se não existe, remove se existe."""
    try:
        # Verificar se já está nos favoritos
        existing_favorite = db.favorites.find_one({
            "user_id": ObjectId(user_id),
            "ad_id": ObjectId(ad_id)
        })

        if existing_favorite:
            # Remover dos favoritos
            db.favorites.delete_one({"_id": existing_favorite["_id"]})
            return {
                "success": True,
                "message": "Anúncio removido dos favoritos",
                "data": {"is_favorited": False, "action": "removed"}
            }
        else:
            # Adicionar aos favoritos
            result = add_to_favorites(user_id, ad_id)
            if result["success"]:
                return {
                    "success": True,
                    "message": "Anúncio adicionado aos favoritos",
                    "data": {"is_favorited": True, "action": "added"}
                }
            else:
                return result

    except Exception as e:
        return {"success": False, "message": f"Erro ao alternar favorito: {str(e)}"}


def get_ad_favorites_count(ad_id):
    """Retorna a quantidade de usuários que favoritaram um anúncio."""
    try:
        count = db.favorites.count_documents({"ad_id": ObjectId(ad_id)})
        return {"success": True, "count": count}
    except Exception as e:
        return {"success": False, "message": f"Erro ao contar favoritos: {str(e)}"}
