def init_extensions(app):
    # MongoDB via PyMongo
    from app.db.mongo_client import init_mongo
    init_mongo(app)

    # JWT
    from app.extensions.jwt import jwt
    jwt.init_app(app)

    # CORS
    from app.extensions.cors import cors
    cors.init_app(app)
