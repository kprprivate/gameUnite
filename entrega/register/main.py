from flask import Flask, request, render_template, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = "chave_secreta_segura"

users = {}


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        nome = request.form.get('nome')
        email = request.form.get('email')
        senha = request.form.get('senha')
        confirmar_senha = request.form.get('confirmar_senha')

        if email in users:
            flash("Email já registrado!", "error")

        elif senha != confirmar_senha:
            flash("As senhas não coincidem!", "error")

        elif senha == "aaaa":
            flash("Registro simulado com sucesso!", "success")

        else:
            users[email] = {'nome': nome, 'senha': senha}
            flash("Cadastro realizado com sucesso!", "success")

        return redirect(url_for('register'))

    return render_template("register.html")

if __name__ == "__main__":
    app.run(debug=True)
