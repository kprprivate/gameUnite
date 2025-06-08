from flask import jsonify


def success_response(data=None, message=None, status_code=200):
    """Retorna uma resposta de sucesso padronizada."""
    response = {
        "success": True
    }

    if data is not None:
        response["data"] = data

    if message is not None:
        response["message"] = message

    return jsonify(response), status_code


def error_response(message="Ocorreu um erro", errors=None, status_code=400):
    """Retorna uma resposta de erro padronizada."""
    response = {
        "success": False,
        "message": message
    }

    if errors is not None:
        response["errors"] = errors

    return jsonify(response), status_code


def create_response(success, message, data=None, status_code=None):
    """Cria uma resposta padronizada."""
    if success:
        if status_code is None:
            status_code = 200
        return {
            "success": True,
            "message": message,
            "data": data,
            "status_code": status_code
        }
    else:
        if status_code is None:
            status_code = 400
        return {
            "success": False,
            "message": message,
            "status_code": status_code
        }
