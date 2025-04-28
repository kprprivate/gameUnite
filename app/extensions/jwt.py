from flask_jwt_extended import JWTManager

jwt = JWTManager()

# Função opcional para personalizar tratamento de erros JWT
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return {
        "success": False,
        "message": "O token está expirado"
    }, 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return {
        "success": False,
        "message": "Token inválido"
    }, 401

@jwt.unauthorized_loader
def unauthorized_callback(error):
    return {
        "success": False,
        "message": "Token não fornecido"
    }, 401
