from flask import Blueprint, request, g
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from app.services.favorites.favorites_service import (
    add_to_favorites, remove_from_favorites, get_user_favorites,
    is_ad_favorited, toggle_favorite
)

# Criar blueprint
favorites_bp = Blueprint("favorites", __name__)


@favorites_bp.route("/", methods=["GET"])
@jwt_required
def get_favorites():
    """Retorna os favoritos do usuário logado."""
    try:
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))

        result = get_user_favorites(g.user["_id"], limit, skip)

        if result["success"]:
            return success_response(
                data=result["data"],
                message="Favoritos encontrados com sucesso"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar favoritos: {str(e)}")


@favorites_bp.route("/<ad_id>", methods=["POST"])
@jwt_required
def add_favorite(ad_id):
    """Adiciona um anúncio aos favoritos."""
    try:
        result = add_to_favorites(g.user["_id"], ad_id)

        if result["success"]:
            return success_response(
                data=result["data"],
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao adicionar favorito: {str(e)}")


@favorites_bp.route("/<ad_id>", methods=["DELETE"])
@jwt_required
def remove_favorite(ad_id):
    """Remove um anúncio dos favoritos."""
    try:
        result = remove_from_favorites(g.user["_id"], ad_id)

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao remover favorito: {str(e)}")


@favorites_bp.route("/<ad_id>/toggle", methods=["POST"])
@jwt_required
def toggle_favorite_route(ad_id):
    """Alterna favorito (adiciona se não existe, remove se existe)."""
    try:
        result = toggle_favorite(g.user["_id"], ad_id)

        if result["success"]:
            return success_response(
                data=result["data"],
                message=result["message"]
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao alternar favorito: {str(e)}")


@favorites_bp.route("/<ad_id>/check", methods=["GET"])
@jwt_required
def check_favorite(ad_id):
    """Verifica se um anúncio está nos favoritos do usuário."""
    try:
        result = is_ad_favorited(g.user["_id"], ad_id)

        if result["success"]:
            return success_response(data=result["data"])
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao verificar favorito: {str(e)}")


# app/services/favorites/__init__.py


# app/services/favorites/favorites_service.py
from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id


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
