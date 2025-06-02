from flask import Blueprint, request, g, jsonify
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from bson import ObjectId
from app.db.mongo_client import db
from datetime import datetime
from app.services.ad.ad_service import (
    create_ad, get_user_ads, get_ad_by_id, update_ad, delete_ad, like_ad, get_ad_likes
)

# Criar blueprint
ads_bp = Blueprint("ads", __name__)


@ads_bp.route("/", methods=["GET"])
def get_ads():
    """Retorna anúncios com filtros opcionais."""
    try:
        # Parâmetros de query
        game_id = request.args.get("game_id")
        ad_type = request.args.get("ad_type")
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))

        # Construir query
        query = {"status": "active"}

        if game_id:
            query["game_id"] = ObjectId(game_id)

        if ad_type:
            query["ad_type"] = ad_type

        # Buscar anúncios
        ads_cursor = db.ads.find(query).sort("created_at", -1).skip(skip).limit(limit)

        # Converter cursor para lista
        ads_list = []
        for ad in ads_cursor:
            try:
                # Buscar dados do jogo
                game = db.games.find_one({"_id": ad["game_id"]})

                ad_data = {
                    "_id": str(ad["_id"]),
                    "user_id": str(ad["user_id"]),
                    "game_id": str(ad["game_id"]),
                    "title": ad.get("title", ""),
                    "description": ad.get("description", ""),
                    "ad_type": ad.get("ad_type", "venda"),
                    "platform": ad.get("platform", "PC"),  # CORRIGIDO: valor padrão
                    "condition": ad.get("condition", "usado"),  # CORRIGIDO: valor padrão
                    "status": ad.get("status", "active"),
                    "is_boosted": ad.get("is_boosted", False),
                    "view_count": ad.get("view_count", 0),
                    "total_likes": len(ad.get("likes", [])),
                    "created_at": ad["created_at"].isoformat() if ad.get(
                        "created_at") else datetime.utcnow().isoformat(),
                    "updated_at": ad["updated_at"].isoformat() if ad.get(
                        "updated_at") else datetime.utcnow().isoformat(),
                    "game": {
                        "_id": str(game["_id"]),
                        "name": game["name"],
                        "image_url": game.get("image_url", "")
                    } if game else None
                }

                # Adicionar preço se for venda
                if ad.get("price_per_hour"):
                    ad_data["price"] = ad["price_per_hour"]

                # Adicionar imagem se existir
                if ad.get("image_url"):
                    ad_data["image_url"] = ad["image_url"]

                ads_list.append(ad_data)
            except Exception as e:
                print(f"Erro ao processar anúncio {ad.get('_id')}: {e}")
                continue

        return success_response(
            data={"ads": ads_list},
            message="Anúncios encontrados com sucesso"
        )
    except Exception as e:
        return error_response(f"Erro ao buscar anúncios: {str(e)}")


@ads_bp.route("/boosted", methods=["GET"])
def get_boosted_ads():
    """Retorna anúncios em destaque (boosted)."""
    try:
        game_id = request.args.get("game_id")
        limit = int(request.args.get("limit", 5))

        # Construir query
        query = {"status": "active", "is_boosted": True}

        if game_id:
            query["game_id"] = ObjectId(game_id)

        # Buscar anúncios em destaque
        boosted_cursor = db.ads.find(query).limit(limit)

        # Converter cursor para lista
        boosted_ads_list = []
        for ad in boosted_cursor:
            try:
                # Buscar dados do jogo
                game = db.games.find_one({"_id": ad["game_id"]})

                ad_data = {
                    "_id": str(ad["_id"]),
                    "user_id": str(ad["user_id"]),
                    "game_id": str(ad["game_id"]),
                    "title": ad.get("title", ""),
                    "description": ad.get("description", ""),
                    "ad_type": ad.get("ad_type", "venda"),
                    "platform": ad.get("platform", "PC"),  # CORRIGIDO: valor padrão
                    "condition": ad.get("condition", "usado"),  # CORRIGIDO: valor padrão
                    "status": ad.get("status", "active"),
                    "is_boosted": ad.get("is_boosted", False),
                    "view_count": ad.get("view_count", 0),
                    "total_likes": len(ad.get("likes", [])),
                    "created_at": ad["created_at"].isoformat() if ad.get(
                        "created_at") else datetime.utcnow().isoformat(),
                    "updated_at": ad["updated_at"].isoformat() if ad.get(
                        "updated_at") else datetime.utcnow().isoformat(),
                    "game": {
                        "_id": str(game["_id"]),
                        "name": game["name"],
                        "image_url": game.get("image_url", "")
                    } if game else None
                }

                # Adicionar preço se for venda
                if ad.get("price_per_hour"):
                    ad_data["price"] = ad["price_per_hour"]

                # Adicionar imagem se existir
                if ad.get("image_url"):
                    ad_data["image_url"] = ad["image_url"]

                boosted_ads_list.append(ad_data)
            except Exception as e:
                print(f"Erro ao processar anúncio em destaque {ad.get('_id')}: {e}")
                continue

        return success_response(
            data={"boosted_ads": boosted_ads_list},
            message="Anúncios em destaque encontrados"
        )
    except Exception as e:
        return error_response(f"Erro ao buscar anúncios em destaque: {str(e)}")


@ads_bp.route("/", methods=["POST"])
@jwt_required
def create_ad_route():
    """Cria um novo anúncio."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        # Validar campos obrigatórios
        required_fields = ["game_id", "title", "description", "ad_type", "platform", "condition"]
        for field in required_fields:
            if field not in data:
                return error_response(f"Campo '{field}' é obrigatório", status_code=400)

        # Validar tipo de anúncio
        if data["ad_type"] not in ["venda", "troca", "procura"]:
            return error_response("Tipo de anúncio inválido", status_code=400)

        # Validar preço para vendas
        if data["ad_type"] == "venda" and "price" not in data:
            return error_response("Preço é obrigatório para vendas", status_code=400)

        # Criar anúncio
        result = create_ad(g.user["_id"], data)

        if result["success"]:
            return success_response(
                data={"ad": result["ad"]},
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao criar anúncio: {str(e)}")


@ads_bp.route("/<ad_id>", methods=["GET"])
def get_ad_details(ad_id):
    """Retorna detalhes de um anúncio específico."""
    try:
        # Verificar se há usuário logado para evitar incrementar view do próprio anúncio
        user_id = None
        if hasattr(g, 'user') and g.user:
            user_id = str(g.user["_id"])  # Converter para string aqui

        result = get_ad_by_id(ad_id, increment_view=True, user_id=user_id)

        if result["success"]:
            return success_response(
                data={"ad": result["ad"]},
                message="Anúncio encontrado com sucesso"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        return error_response(f"Erro ao buscar anúncio: {str(e)}")


@ads_bp.route("/<ad_id>/edit", methods=["GET"])
@jwt_required
def get_ad_for_edit(ad_id):
    """Retorna anúncio para edição (sem incrementar view)."""
    try:
        user_id = str(g.user["_id"])  # Converter para string aqui
        result = get_ad_by_id(ad_id, increment_view=False, user_id=user_id)

        if result["success"]:
            # Verificar se o usuário é o dono do anúncio
            if result["ad"]["user_id"] != user_id:
                return error_response("Acesso negado", status_code=403)

            return success_response(
                data={"ad": result["ad"]},
                message="Anúncio encontrado para edição"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        return error_response(f"Erro ao buscar anúncio para edição: {str(e)}")


@ads_bp.route("/<ad_id>", methods=["PUT"])
@jwt_required
def update_ad_route(ad_id):
    """Atualiza um anúncio existente."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        result = update_ad(ad_id, g.user["_id"], data)

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao atualizar anúncio: {str(e)}")


@ads_bp.route("/<ad_id>", methods=["DELETE"])
@jwt_required
def delete_ad_route(ad_id):
    """Remove um anúncio."""
    try:
        result = delete_ad(ad_id, g.user["_id"])

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao remover anúncio: {str(e)}")


@ads_bp.route("/<ad_id>/like", methods=["POST"])
@jwt_required
def like_ad_route(ad_id):
    """Curte/descurte um anúncio."""
    try:
        result = like_ad(ad_id, g.user["_id"])

        if result["success"]:
            return success_response(
                data={
                    "liked": result["liked"],
                    "total_likes": result["total_likes"]
                },
                message=result["message"]
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao curtir anúncio: {str(e)}")


@ads_bp.route("/<ad_id>/likes", methods=["GET"])
def get_ad_likes_route(ad_id):
    """Retorna informações de curtidas do anúncio."""
    try:
        user_id = None
        if hasattr(g, 'user') and g.user:
            user_id = g.user["_id"]

        result = get_ad_likes(ad_id, user_id)

        if result["success"]:
            return success_response(
                data={
                    "total_likes": result["total_likes"],
                    "user_liked": result["user_liked"]
                },
                message="Informações de curtidas encontradas"
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao buscar curtidas: {str(e)}")


@ads_bp.route("/user/<user_id>", methods=["GET"])
def get_user_ads_route(user_id):
    """Retorna anúncios de um usuário específico."""
    try:
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))

        result = get_user_ads(user_id, limit, skip)

        if result["success"]:
            return success_response(
                data={"ads": result["ads"], "total": result["total"]},
                message="Anúncios do usuário encontrados"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar anúncios do usuário: {str(e)}")


@ads_bp.route("/my-ads", methods=["GET"])
@jwt_required
def get_my_ads():
    """Retorna anúncios do usuário logado."""
    try:
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))

        result = get_user_ads(g.user["_id"], limit, skip)

        if result["success"]:
            return success_response(
                data={"ads": result["ads"], "total": result["total"]},
                message="Seus anúncios encontrados"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        return error_response(f"Erro ao buscar seus anúncios: {str(e)}")