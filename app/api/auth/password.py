from flask import request
from app.utils.helpers.response_helpers import success_response, error_response
from app.services.auth.password_service import request_password_reset, reset_password


def request_reset_handler():
    """Handler para requisição de reset de senha."""
    data = request.json

    if not data or "email" not in data:
        return error_response("Email é obrigatório", status_code=400)

    result = request_password_reset(data["email"])

    if result["success"]:
        return success_response(message=result["message"], status_code=200)
    else:
        # Não revelar se o email existe ou não por motivos de segurança
        return success_response(
            message="Se o email estiver cadastrado, enviaremos um link para redefinição de senha.",
            status_code=200
        )


def reset_password_handler():
    """Handler para redefinir senha."""
    data = request.json

    if not data or "token" not in data or "password" not in data:
        return error_response("Token e nova senha são obrigatórios", status_code=400)

    result = reset_password(data["token"], data["password"])

    if result["success"]:
        return success_response(message=result["message"], status_code=200)
    else:
        return error_response(result["message"], status_code=400)
