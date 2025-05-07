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

        if senha == "aaaa":
            flash("Registro simulado com sucesso!", "success")
        else:
            flash("Senha inválida para simulado!", "error")

        return redirect(url_for('register'))

    return render_template("register.html")

if __name__ == "__main__":
    app.run(debug=True)
