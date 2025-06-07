from flask import Flask
import os

def create_app(config_name="development"):
    app = Flask(__name__)

    # Configuração importante para evitar redirects em trailing slashes
    app.url_map.strict_slashes = False

    # Carregar configuração
    from app.config import get_config
    app.config.from_object(get_config(config_name))

    # Configurar pasta de uploads
    app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

    # Inicializar extensões ANTES dos blueprints (incluindo SocketIO)
    from app.extensions import init_extensions
    init_extensions(app)

    # Registrar blueprints DEPOIS das extensões
    from app.api import register_blueprints
    register_blueprints(app)

    # Registrar eventos do WebSocket
    from app.websockets import chat_events

    # Configurar índices do MongoDB - com tratamento de erro
    if config_name != "testing":  # Skip index setup in test mode
        from app.models import setup_indexes
        with app.app_context():
            try:
                setup_indexes()
                print("MongoDB indexes configured successfully")
            except Exception as e:
                print(f"Warning: Could not configure indexes: {e}")

    return app