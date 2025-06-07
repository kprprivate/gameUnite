from flask_socketio import SocketIO

# Configuração SocketIO para desenvolvimento
socketio = SocketIO(
    cors_allowed_origins=[
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    async_mode='threading',
    logger=True,
    engineio_logger=True
)