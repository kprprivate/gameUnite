from flask import Blueprint, request, jsonify
from app.utils.decorators.auth_decorators import jwt_required, admin_required
from app.utils.helpers.response_helpers import success_response, error_response
from bson import ObjectId
from app.db.mongo_client import db

# Criar blueprint para games
games_bp = Blueprint("games", __name__)


@games_bp.route("/", methods=["GET"])
def get_games():
    """Retorna a lista de jogos disponíveis."""
    try:
        # Parâmetros de query
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))
        search = request.args.get("search", "")

        # Construir query
        query = {}
        if search:
            query["name"] = {"$regex": search, "$options": "i"}  # Busca case-insensitive

        # Buscar jogos no MongoDB
        games_cursor = db.games.find(query).sort("name", 1).skip(skip).limit(limit)

        # Converter cursor para lista
        games = []
        for game in games_cursor:
            game["_id"] = str(game["_id"])
            games.append(game)

        return success_response(
            data={"games": games, "total": len(games)},
            message="Jogos encontrados com sucesso"
        )
    except Exception as e:
        return error_response(f"Erro ao buscar jogos: {str(e)}")


@games_bp.route("/<game_id>", methods=["GET"])
def get_game(game_id):
    """Retorna detalhes de um jogo específico."""
    try:
        # Buscar jogo pelo ID
        game = db.games.find_one({"_id": ObjectId(game_id)})

        if not game:
            return error_response("Jogo não encontrado", status_code=404)

        # Converter ObjectId para string
        game["_id"] = str(game["_id"])

        return success_response(
            data={"game": game},
            message="Jogo encontrado com sucesso"
        )
    except Exception as e:
        return error_response(f"Erro ao buscar jogo: {str(e)}")


@games_bp.route("/featured", methods=["GET"])
def get_featured_games():
    """Retorna jogos em destaque."""
    try:
        # Buscar jogos em destaque
        featured_cursor = db.games.find({"is_featured": True}).limit(10)

        # Converter cursor para lista
        featured_games = []
        for game in featured_cursor:
            game["_id"] = str(game["_id"])
            featured_games.append(game)

        return success_response(
            data={"featured_games": featured_games},
            message="Jogos em destaque encontrados com sucesso"
        )
    except Exception as e:
        return error_response(f"Erro ao buscar jogos em destaque: {str(e)}")


@games_bp.route("/", methods=["POST"])
@admin_required
def create_game():
    """Cria um novo jogo (apenas admin)."""
    try:
        # Obter dados do request
        data = request.json

        # Validar dados obrigatórios
        if not data or not data.get("name"):
            return error_response("Nome do jogo é obrigatório", status_code=400)

        # Verificar se jogo já existe
        existing_game = db.games.find_one({"name": data["name"]})
        if existing_game:
            return error_response("Jogo com este nome já existe", status_code=400)

        # Criar slug a partir do nome
        from slugify import slugify
        slug = data.get("slug", slugify(data["name"]))

        # Verificar se slug já existe
        existing_slug = db.games.find_one({"slug": slug})
        if existing_slug:
            return error_response("Slug já em uso", status_code=400)

        # Preparar dados do jogo
        from datetime import datetime
        new_game = {
            "name": data["name"],
            "slug": slug,
            "description": data.get("description", ""),
            "image_url": data.get("image_url", ""),
            "cover_url": data.get("cover_url", ""),
            "is_featured": data.get("is_featured", False),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Inserir no banco
        result = db.games.insert_one(new_game)
        new_game["_id"] = str(result.inserted_id)

        return success_response(
            data={"game": new_game},
            message="Jogo criado com sucesso",
            status_code=201
        )
    except Exception as e:
        return error_response(f"Erro ao criar jogo: {str(e)}")


@games_bp.route("/<game_id>", methods=["PUT"])
@admin_required
def update_game(game_id):
    """Atualiza um jogo existente (apenas admin)."""
    try:
        # Obter dados do request
        data = request.json

        if not data:
            return error_response("Dados inválidos", status_code=400)

        # Verificar se jogo existe
        game = db.games.find_one({"_id": ObjectId(game_id)})
        if not game:
            return error_response("Jogo não encontrado", status_code=404)

        # Preparar dados para atualização
        update_data = {k: v for k, v in data.items() if k not in ["_id", "created_at"]}
        update_data["updated_at"] = datetime.utcnow()

        # Atualizar jogo
        db.games.update_one(
            {"_id": ObjectId(game_id)},
            {"$set": update_data}
        )

        # Buscar jogo atualizado
        updated_game = db.games.find_one({"_id": ObjectId(game_id)})
        updated_game["_id"] = str(updated_game["_id"])

        return success_response(
            data={"game": updated_game},
            message="Jogo atualizado com sucesso"
        )
    except Exception as e:
        return error_response(f"Erro ao atualizar jogo: {str(e)}")


@games_bp.route("/<game_id>", methods=["DELETE"])
@admin_required
def delete_game(game_id):
    """Remove um jogo (apenas admin)."""
    try:
        # Verificar se jogo existe
        game = db.games.find_one({"_id": ObjectId(game_id)})
        if not game:
            return error_response("Jogo não encontrado", status_code=404)

        # Verificar se existem anúncios vinculados
        ads_count = db.ads.count_documents({"game_id": ObjectId(game_id)})
        if ads_count > 0:
            return error_response(
                f"Não é possível excluir o jogo pois existem {ads_count} anúncios vinculados",
                status_code=400
            )

        # Remover jogo
        db.games.delete_one({"_id": ObjectId(game_id)})

        return success_response(
            message="Jogo removido com sucesso"
        )
    except Exception as e:
        return error_response(f"Erro ao remover jogo: {str(e)}")
