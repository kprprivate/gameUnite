from flask import request
from app.services.auth.register_service import register_user
from app.utils.helpers.response_helpers import success_response, error_response


def register_handler():
    """Handler para registro de usuário."""
    data = request.json

    # Verificar se os dados necessários foram fornecidos
    if not data:
        return error_response("Dados inválidos", status_code=400)

    # Campos obrigatórios
    required_fields = ["username", "email", "password"]

    # Verificar campos obrigatórios
    for field in required_fields:
        if field not in data:
            return error_response(f"O campo '{field}' é obrigatório", status_code=400)

    # Registrar usuário
    result = register_user(
        username=data["username"],
        email=data["email"],
        password=data["password"],
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", "")
    )

    # Verificar resultado
    if result["success"]:
        return success_response(
            data={"user": result["user"]},
            message=result["message"],
            status_code=201
        )
    else:
        return error_response(result["message"], status_code=400)
