from flask import Blueprint, jsonify
import time
import platform
from datetime import datetime
from app.db.mongo_client import mongo_client
import os
import sys

# Tempo de início da aplicação (para calcular uptime)
start_time = time.time()

# Criar blueprint
health_bp = Blueprint("health", __name__)


@health_bp.route("/", methods=["GET"])
def health_check():
    """
    Endpoint para verificar a saúde da aplicação.
    Verifica conexão com o MongoDB e retorna informações do sistema.
    """
    # Verificar conexão com MongoDB
    mongo_status = check_mongo_connection()

    # Calcular uptime
    uptime_seconds = time.time() - start_time
    days, remainder = divmod(uptime_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)

    uptime_string = f"{int(days)}d {int(hours)}h {int(minutes)}m {int(seconds)}s"

    # Status geral
    overall_status = "healthy" if mongo_status["ok"] else "unhealthy"

    # Obter informações do sistema
    system_info = {
        "python_version": sys.version.split()[0],
        "os": platform.system(),
        "platform": platform.platform()
    }

    # Construir resposta
    health_info = {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": uptime_string,
        "environment": os.getenv("FLASK_ENV", "development"),
        "dependencies": {
            "mongodb": mongo_status
        },
        "system_info": system_info
    }

    # HTTP status baseado na saúde geral
    http_status = 200 if overall_status == "healthy" else 503

    return jsonify(health_info), http_status


def check_mongo_connection():
    """Verifica se a conexão com o MongoDB está funcionando."""
    try:
        # Tenta fazer um ping no servidor MongoDB
        mongo_client.admin.command('ping')
        return {
            "ok": True,
            "message": "Conexão com MongoDB estabelecida com sucesso"
        }
    except Exception as e:
        return {
            "ok": False,
            "message": f"Erro na conexão com MongoDB: {str(e)}"
        }
