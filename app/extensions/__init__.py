from flask import request


def init_extensions(app):
    # Configurar CORS primeiro, antes de outros middlewares
    from app.extensions.cors import cors
    cors.init_app(app)

    # Configuração adicional do CORS diretamente no app
    @app.after_request
    def after_request(response):
        # Headers CORS adicionais para garantir compatibilidade
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'

        # Adicionar headers de cache para OPTIONS requests
        if response.status_code == 200 and request.method == 'OPTIONS':
            response.headers['Access-Control-Max-Age'] = '86400'  # 24 hours

        return response

    # MongoDB via PyMongo
    from app.db.mongo_client import init_mongo
    init_mongo(app)

    # JWT
    from app.extensions.jwt import jwt
    jwt.init_app(app)