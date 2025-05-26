from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# Usuário e senha fictícios
USUARIO = "Luva de Pedreiro"
SENHA = "RECEBAA"

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form['usuario']
        senha = request.form['senha']
        if usuario == USUARIO and senha == SENHA:
            return redirect(url_for('bem_vindo'))
        else:
            return "Usuário ou senha incorretos!"
    return render_template('login.html')

@app.route('/bem_vindo')
def bem_vindo():
    return "Bem-vindo ao sistema!"

if __name__ == '__main__':
    app.run(debug=True)
