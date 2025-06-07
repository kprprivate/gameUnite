import os
from app import create_app 
from app.extensions.socketio import socketio

app = create_app("testing")

if __name__ == '__main__': 
    # Usar socketio.run ao invés de app.run para suporte WebSocket
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)