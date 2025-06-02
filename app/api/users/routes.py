# app/api/users/routes.py
from flask import Blueprint, request, g
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from app.services.user.user_service import (
    get_user_profile, update_user_profile, change_password, get_user_dashboard_data, get_user_public_profile
)

# Criar blueprint
users_bp = Blueprint("users", __name__)


@users_bp.route("/profile", methods=["GET"])
@jwt_required
def get_profile():
    """Retorna o perfil do usuário logado."""
    try:
        result = get_user_profile(g.user["_id"])

        if result["success"]:
            return success_response(
                data={"user": result["user"]},
                message="Perfil encontrado com sucesso"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        return error_response(f"Erro ao buscar perfil: {str(e)}")


@users_bp.route("/profile", methods=["PUT"])
@jwt_required
def update_profile():
    """Atualiza o perfil do usuário logado."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        result = update_user_profile(g.user["_id"], data)

        if result["success"]:
            return success_response(
                data={"user": result["user"]},
                message=result["message"]
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao atualizar perfil: {str(e)}")


@users_bp.route("/change-password", methods=["POST"])
@jwt_required
def change_user_password():
    """Altera a senha do usuário logado."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        # Validar campos obrigatórios
        required_fields = ["current_password", "new_password"]
        for field in required_fields:
            if field not in data:
                return error_response(f"Campo '{field}' é obrigatório", status_code=400)

        result = change_password(g.user["_id"], data["current_password"], data["new_password"])

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao alterar senha: {str(e)}")


@users_bp.route("/dashboard", methods=["GET"])
@jwt_required
def get_dashboard_data():
    """Retorna dados para o dashboard do usuário."""
    try:
        result = get_user_dashboard_data(g.user["_id"])

        if result["success"]:
            return success_response(
                data=result["data"],
                message="Dados do dashboard encontrados"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        return error_response(f"Erro ao buscar dados do dashboard: {str(e)}")


@users_bp.route("/<user_id>", methods=["GET"])
def get_user_public_profile_route(user_id):
    """Retorna o perfil público de um usuário."""
    try:
        result = get_user_public_profile(user_id)

        if result["success"]:
            return success_response(
                data={"user": result["user"]},
                message="Perfil público encontrado"
            )
        else:
            return error_response(result["message"], status_code=404)

    except Exception as e:
        return error_response(f"Erro ao buscar perfil público: {str(e)}")


@users_bp.route("/<user_id>/ads", methods=["GET"])
def get_user_public_ads(user_id):
    """Retorna anúncios públicos de um usuário."""
    try:
        from app.services.ad.ad_service import get_user_ads

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