from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.services.auth.login_service import login_user, refresh_auth_token
from app.utils.helpers.response_helpers import success_response, error_response


def login_handler():
    """Handler para login de usuário."""
    data = request.json

    # Verificar se os dados necessários foram fornecidos
    if not data:
        return error_response("Dados inválidos", status_code=400)

    # Verificar campos obrigatórios
    if "email" not in data or "password" not in data:
        return error_response("Email e senha são obrigatórios", status_code=400)

    # Fazer login
    result = login_user(data["email"], data["password"])

    # Verificar resultado
    if result["success"]:
        return success_response(
            data={
                "user": result["user"],
                "access_token": result["access_token"],
                "refresh_token": result["refresh_token"]
            },
            message=result["message"],
            status_code=200
        )
    else:
        return error_response(result["message"], status_code=401)


@jwt_required()
def refresh_token_handler():
    """Handler para refresh de token."""
    user_id = get_jwt_identity()
    result = refresh_auth_token(user_id)

    return success_response(
        data={"access_token": result["access_token"]},
        message="Token atualizado com sucesso",
        status_code=200
    )
