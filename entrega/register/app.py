from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId

app = Flask(__name__)

app.config["MONGO_URI"] = "mongodb://localhost:27017/gamersDB"
mongo = PyMongo(app)

app.config["JWT_SECRET_KEY"] = "sua_chave_secreta"  # Troque por uma chave secreta real
jwt = JWTManager(app)

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    hashed_password = generate_password_hash(data['senha'], method='sha256')
    mongo.db.users.insert_one({
        "nome": data['nome'],
        "email": data['email'],
        "senha": hashed_password
    })
    return jsonify({"message": "Cadastro realizado com sucesso!"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = mongo.db.users.find_one({"email": data['email']})

    if user and check_password_hash(user['senha'], data['senha']):
        token = create_access_token(identity=str(user['_id']))
        return jsonify({"token": token}), 200
    return jsonify({"message": "Credenciais inválidas"}), 401

@app.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt_identity()  # Identificador único do token
    mongo.db.revoked_tokens.insert_one({"jti": jti})
    return jsonify({"message": "Logout realizado com sucesso!"}), 200

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    token = mongo.db.revoked_tokens.find_one({"jti": jti})
    return token is not None

@app.route("/user/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"message": "Você não tem permissão para deletar este usuário."}), 403

    try:
        mongo.db.users.delete_one({"_id": ObjectId(user_id)})
        return jsonify({"message": "Usuário deletado com sucesso!"}), 200
    except Exception as e:
        return jsonify({"message": "Erro ao deletar usuário.", "error": str(e)}), 500

@app.route("/")
def index():
    return redirect(url_for('login_page'))

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/register")
def register_page():
    return render_template("register.html")

@app.route("/profile")
@jwt_required()
def profile():
    return render_template("profile.html")

if __name__ == "__main__":
    app.run(debug=True)
