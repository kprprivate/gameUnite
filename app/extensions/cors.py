from flask_cors import CORS

# Configuração CORS robusta para desenvolvimento
cors = CORS(
    supports_credentials=True,
    origins=[
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        'http://localhost:5173',  # Vite dev server alternativo
    ],
    allow_headers=[
        'Content-Type',
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    expose_headers=['Authorization'],
    max_age=86400  # Cache preflight por 24 horas
)