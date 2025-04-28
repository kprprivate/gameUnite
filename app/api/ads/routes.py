from flask import Blueprint, request
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from bson import ObjectId
from app.db.mongo_client import db
from datetime import datetime

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
        ads = []
        for ad in ads_cursor:
            ad["_id"] = str(ad["_id"])
            ad["user_id"] = str(ad["user_id"])
            ad["game_id"] = str(ad["game_id"])
            ads.append(ad)

        return success_response(
            data={"ads": ads},
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
        boosted_ads = []
        for ad in boosted_cursor:
            ad["_id"] = str(ad["_id"])
            ad["user_id"] = str(ad["user_id"])
            ad["game_id"] = str(ad["game_id"])
            boosted_ads.append(ad)

        return success_response(
            data={"boosted_ads": boosted_ads},
            message="Anúncios em destaque encontrados"
        )
    except Exception as e:
        return error_response(f"Erro ao buscar anúncios em destaque: {str(e)}")


@ads_bp.route("/", methods=["POST"])
@jwt_required
def create_ad():
    """Cria um novo anúncio."""
    # Implementação básica do endpoint de criação de anúncios
    return success_response(message="Endpoint de criação de anúncios")
