# app/api/ads/routes.py - VERSÃO CORRIGIDA COM VALIDAÇÕES
from flask import Blueprint, request, g, jsonify

from app.services.ad.ad_service import format_ad_response, create_ad, get_ad_by_id, update_ad, like_ad, delete_ad, \
    get_ad_likes, get_user_ads
from app.services.ad_questions.questions_service import validate_object_id
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from bson import ObjectId, errors as bson_errors
from app.db.mongo_client import db
from datetime import datetime

# Criar blueprint
ads_bp = Blueprint("ads", __name__)


def validate_pagination_params(request):
    """Valida e retorna parâmetros de paginação."""
    try:
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))

        # Limitar valores máximos para evitar sobrecarga
        limit = min(max(1, limit), 100)  # Entre 1 e 100
        skip = max(0, skip)  # Não pode ser negativo

        return limit, skip
    except ValueError:
        return 20, 0  # Valores padrão em caso de erro


@ads_bp.route("/", methods=["GET"])
def get_ads():
    """Retorna anúncios com filtros opcionais e validação rigorosa."""
    try:
        # Parâmetros de query com validação
        game_id = request.args.get("game_id")
        ad_type = request.args.get("ad_type")
        limit, skip = validate_pagination_params(request)

        # Construir query
        query = {"status": "active"}

        # Validar e adicionar filtro de jogo
        if game_id:
            if not validate_object_id(game_id):
                return error_response("ID de jogo inválido", status_code=400)
            query["game_id"] = ObjectId(game_id)

        # Validar e adicionar filtro de tipo
        if ad_type and ad_type in ["venda", "troca", "procura"]:
            query["ad_type"] = ad_type

        # Buscar anúncios
        ads_cursor = db.ads.find(query).sort("created_at", -1).skip(skip).limit(limit)

        # Converter cursor para lista com tratamento de erro
        ads_list = []
        for ad in ads_cursor:
            try:
                # Validar se o anúncio tem dados mínimos necessários
                if not ad.get("_id") or not ad.get("user_id") or not ad.get("game_id"):
                    print(f"Anúncio inválido ignorado: {ad.get('_id')}")
                    continue

                # Buscar dados do jogo
                game = db.games.find_one({"_id": ad["game_id"]})
                if not game:
                    print(f"Jogo não encontrado para anúncio {ad.get('_id')}")
                    continue

                # Formatar anúncio
                ad_data = format_ad_response(ad, game)

                # Verificar se a formatação foi bem sucedida
                if ad_data and ad_data.get("_id"):
                    ads_list.append(ad_data)

            except Exception as e:
                print(f"Erro ao processar anúncio {ad.get('_id')}: {e}")
                continue

        return success_response(
            data={"ads": ads_list, "total": len(ads_list)},
            message="Anúncios encontrados com sucesso"
        )

    except Exception as e:
        print(f"Erro ao buscar anúncios: {e}")
        return error_response(f"Erro interno ao buscar anúncios: {str(e)}")


@ads_bp.route("/boosted", methods=["GET"])
def get_boosted_ads():
    """Retorna anúncios em destaque com validação."""
    try:
        game_id = request.args.get("game_id")
        limit = min(int(request.args.get("limit", 5)), 20)  # Máximo de 20

        # Construir query
        query = {"status": "active", "is_boosted": True}

        if game_id:
            if not validate_object_id(game_id):
                return error_response("ID de jogo inválido", status_code=400)
            query["game_id"] = ObjectId(game_id)

        # Buscar anúncios em destaque
        boosted_cursor = db.ads.find(query).limit(limit)

        # Converter cursor para lista
        boosted_ads_list = []
        for ad in boosted_cursor:
            try:
                if not ad.get("_id") or not ad.get("game_id"):
                    continue

                # Buscar dados do jogo
                game = db.games.find_one({"_id": ad["game_id"]})
                if not game:
                    continue

                ad_data = format_ad_response(ad, game)
                if ad_data and ad_data.get("_id"):
                    boosted_ads_list.append(ad_data)

            except Exception as e:
                print(f"Erro ao processar anúncio em destaque {ad.get('_id')}: {e}")
                continue

        return success_response(
            data={"boosted_ads": boosted_ads_list},
            message="Anúncios em destaque encontrados"
        )

    except Exception as e:
        print(f"Erro ao buscar anúncios em destaque: {e}")
        return error_response(f"Erro ao buscar anúncios em destaque: {str(e)}")


@ads_bp.route("/", methods=["POST"])
@jwt_required
def create_ad_route():
    """Cria um novo anúncio com validação completa."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        # Validar campos obrigatórios
        required_fields = ["game_id", "title", "description", "ad_type", "platform", "condition"]
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f"Campo '{field}' é obrigatório", status_code=400)

        # Validar tipo de anúncio
        if data["ad_type"] not in ["venda", "troca", "procura"]:
            return error_response("Tipo de anúncio inválido", status_code=400)

        # Validar preço para vendas
        if data["ad_type"] == "venda":
            if "price" not in data or not data["price"]:
                return error_response("Preço é obrigatório para vendas", status_code=400)
            try:
                price = float(data["price"])
                if price <= 0:
                    return error_response("Preço deve ser maior que zero", status_code=400)
            except ValueError:
                return error_response("Preço deve ser um número válido", status_code=400)

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
        print(f"Erro ao criar anúncio: {e}")
        return error_response(f"Erro interno ao criar anúncio: {str(e)}")


@ads_bp.route("/<ad_id>", methods=["GET"])
def get_ad_details(ad_id):
    """Retorna detalhes de um anúncio específico com validação."""
    try:
        # Validar ad_id
        if not validate_object_id(ad_id):
            return error_response("ID de anúncio inválido", status_code=400)

        # Verificar se há usuário logado para evitar incrementar view do próprio anúncio
        user_id = None
        if hasattr(g, 'user') and g.user:
            user_id = str(g.user["_id"])

        result = get_ad_by_id(ad_id, increment_view=True, user_id=user_id)

        if result["success"]:
            return success_response(
                data={"ad": result["ad"]},
                message="Anúncio encontrado com sucesso"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        print(f"Erro ao buscar anúncio {ad_id}: {e}")
        return error_response(f"Erro ao buscar anúncio: {str(e)}")


@ads_bp.route("/<ad_id>/edit", methods=["GET"])
@jwt_required
def get_ad_for_edit(ad_id):
    """Retorna anúncio para edição (sem incrementar view)."""
    try:
        # Validar ad_id
        if not validate_object_id(ad_id):
            return error_response("ID de anúncio inválido", status_code=400)

        user_id = str(g.user["_id"])
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
        print(f"Erro ao buscar anúncio para edição {ad_id}: {e}")
        return error_response(f"Erro ao buscar anúncio para edição: {str(e)}")


@ads_bp.route("/<ad_id>", methods=["PUT"])
@jwt_required
def update_ad_route(ad_id):
    """Atualiza um anúncio existente."""
    try:
        # Validar ad_id
        if not validate_object_id(ad_id):
            return error_response("ID de anúncio inválido", status_code=400)

        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        result = update_ad(ad_id, g.user["_id"], data)

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        print(f"Erro ao atualizar anúncio {ad_id}: {e}")
        return error_response(f"Erro ao atualizar anúncio: {str(e)}")


@ads_bp.route("/<ad_id>", methods=["DELETE"])
@jwt_required
def delete_ad_route(ad_id):
    """Remove um anúncio."""
    try:
        # Validar ad_id
        if not validate_object_id(ad_id):
            return error_response("ID de anúncio inválido", status_code=400)

        result = delete_ad(ad_id, g.user["_id"])

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        print(f"Erro ao remover anúncio {ad_id}: {e}")
        return error_response(f"Erro ao remover anúncio: {str(e)}")


@ads_bp.route("/<ad_id>/like", methods=["POST"])
@jwt_required
def like_ad_route(ad_id):
    """Curte/descurte um anúncio."""
    try:
        # Validar ad_id
        if not validate_object_id(ad_id):
            return error_response("ID de anúncio inválido", status_code=400)

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
        print(f"Erro ao curtir anúncio {ad_id}: {e}")
        return error_response(f"Erro ao curtir anúncio: {str(e)}")


@ads_bp.route("/<ad_id>/likes", methods=["GET"])
def get_ad_likes_route(ad_id):
    """Retorna informações de curtidas do anúncio."""
    try:
        # Validar ad_id
        if not validate_object_id(ad_id):
            return error_response("ID de anúncio inválido", status_code=400)

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
        print(f"Erro ao buscar curtidas {ad_id}: {e}")
        return error_response(f"Erro ao buscar curtidas: {str(e)}")


@ads_bp.route("/user/<user_id>", methods=["GET"])
def get_user_ads_route(user_id):
    """Retorna anúncios de um usuário específico."""
    try:
        # Validar user_id
        if not validate_object_id(user_id):
            return error_response("ID de usuário inválido", status_code=400)

        limit, skip = validate_pagination_params(request)

        result = get_user_ads(user_id, limit, skip)

        if result["success"]:
            return success_response(
                data={"ads": result["ads"], "total": result["total"]},
                message="Anúncios do usuário encontrados"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        print(f"Erro ao buscar anúncios do usuário {user_id}: {e}")
        return error_response(f"Erro ao buscar anúncios do usuário: {str(e)}")


@ads_bp.route("/my-ads", methods=["GET"])
@jwt_required
def get_my_ads():
    """Retorna anúncios do usuário logado."""
    try:
        limit, skip = validate_pagination_params(request)

        result = get_user_ads(g.user["_id"], limit, skip)

        if result["success"]:
            return success_response(
                data={"ads": result["ads"], "total": result["total"]},
                message="Seus anúncios encontrados"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        print(f"Erro ao buscar anúncios do usuário logado: {e}")
        return error_response(f"Erro ao buscar seus anúncios: {str(e)}")


# Rota adicional para debug e limpeza (apenas para desenvolvimento)
@ads_bp.route("/debug/validate", methods=["GET"])
@jwt_required
def validate_ads_debug():
    """Valida e lista anúncios com problemas (apenas para debug)."""
    try:
        # Só permitir em modo de desenvolvimento
        import os
        if os.getenv('FLASK_ENV') != 'development':
            return error_response("Endpoint apenas para desenvolvimento", status_code=403)

        # Buscar todos os anúncios
        ads = list(db.ads.find())

        problems = []
        valid_count = 0

        for ad in ads:
            ad_problems = []

            # Verificar _id
            if not ad.get("_id"):
                ad_problems.append("Sem _id")

            # Verificar user_id
            if not ad.get("user_id") or not validate_object_id(str(ad["user_id"])):
                ad_problems.append("user_id inválido")

            # Verificar game_id
            if not ad.get("game_id") or not validate_object_id(str(ad["game_id"])):
                ad_problems.append("game_id inválido")

            # Verificar campos obrigatórios
            required_fields = ["title", "description", "ad_type"]
            for field in required_fields:
                if not ad.get(field):
                    ad_problems.append(f"{field} ausente")

            if ad_problems:
                problems.append({
                    "_id": str(ad.get("_id", "unknown")),
                    "problems": ad_problems
                })
            else:
                valid_count += 1

        return success_response(
            data={
                "total_ads": len(ads),
                "valid_ads": valid_count,
                "problematic_ads": len(problems),
                "problems": problems[:10]  # Limitar a 10 para não sobrecarregar
            },
            message="Validação de anúncios concluída"
        )

    except Exception as e:
        print(f"Erro na validação de anúncios: {e}")
        return error_response(f"Erro na validação: {str(e)}")