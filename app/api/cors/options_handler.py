# app/api/options_handler.py
from flask import Blueprint, jsonify

# Blueprint para lidar com OPTIONS requests
options_bp = Blueprint("options", __name__)

@options_bp.before_app_request
def handle_preflight():
    """Handle preflight OPTIONS requests"""
    from flask import request
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        response.headers.add("Access-Control-Max-Age", "86400")
        return response

# Handler específico para todas as rotas
@options_bp.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    """Handle all OPTIONS requests"""
    response = jsonify({'status': 'ok'})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    response.headers.add("Access-Control-Max-Age", "86400")
    return response