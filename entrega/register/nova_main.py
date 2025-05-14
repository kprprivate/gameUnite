from flask import Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "chave_secreta_segura"

# Configurações do MongoDB
app.config["MONGO_URI"] = "mongodb://localhost:27017/gamersDB"
mongo = PyMongo(app)

# Configurações do JWT
app.config['JWT_SECRET_KEY'] = 'seu_segredo'  # Troque por uma chave secreta forte
jwt = JWTManager(app)

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        nome = request.form.get('nome')
        email = request.form.get('email')
        senha = request.form.get('senha')
        confirmar_senha = request.form.get('confirmar_senha')

        if mongo.db.users.find_one({"email": email}):
            flash("Email já registrado!", "error")
        elif senha != confirmar_senha:
            flash("As senhas não coincidem!", "error")
        else:
            hashed_password = generate_password_hash(senha, method='sha256')
            mongo.db.users.insert_one({'nome': nome, 'email': email, 'senha': hashed_password})
            flash("Cadastro realizado com sucesso!", "success")
            return redirect(url_for('register'))

    return render_template("register.html")

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
    # Para logout, apenas o cliente deve remover o token
    return jsonify({"message": "Logout realizado com sucesso!"}), 200

@app.route("/user/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"message": "Você não tem permissão para deletar este usuário."}), 403

    mongo.db.users.delete_one({"_id": user_id})
    return jsonify({"message": "Usuário deletado com sucesso!"}), 200

if __name__ == "__main__":
    app.run(debug=True)
