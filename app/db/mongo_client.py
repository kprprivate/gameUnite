from pymongo import MongoClient
from flask import g, current_app
import certifi

# Cliente MongoDB global
mongo_client = None
db = None


def get_db():
    """Retorna a instância atual do banco de dados MongoDB."""
    if 'db' not in g:
        g.db = mongo_client[current_app.config['MONGODB_DB_NAME']]
    return g.db


def init_mongo(app):
    """Inicializa a conexão MongoDB global."""
    global mongo_client, db

    # Obter URI de conexão da configuração
    mongo_uri = app.config['MONGODB_URI']

    # Ensure db_name is lowercase to match existing database
    db_name = app.config.get('MONGODB_DB_NAME', 'gameunite').lower()
    app.config['MONGODB_DB_NAME'] = db_name

    # Criar cliente MongoDB com configurações simplificadas
    mongo_client = MongoClient(
        mongo_uri,
        ssl=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000,  # 5 segundos de timeout
        connectTimeoutMS=30000,  # 30 segundos para a conexão inicial
    )

    # Testar a conexão
    try:
        # Ping para testar conexão
        mongo_client.admin.command('ping')
        print(f"MongoDB conectado com sucesso! Banco de dados: {db_name}")
        db = mongo_client.get_database(db_name)
    except Exception as e:
        print(f"Erro ao conectar ao MongoDB: {e}")
        raise

    # Registrar função para fechar conexão quando a aplicação terminar
    @app.teardown_appcontext
    def close_mongo_connection(exception):
        client = g.pop('mongo_client', None)
        if client:
            client.close()
