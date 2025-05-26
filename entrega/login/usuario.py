from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# Dados do usuário (exemplo simples)
usuarios = {
    1: {
        "nome": "Henrique",
        "descricao": "Desenvolvedor",
        "imagem": "perfil.png"
    }
}


# Rota para a página de exibição do usuário
@app.route('/')
def index():
    usuario = usuarios.get(1)  # Aqui pegamos o usuário de ID 1
    return render_template('index.html', usuario=usuario)


# Rota para a página de edição do usuário
@app.route('/editar_usuario', methods=['GET', 'POST'])
def editar_usuario():
    usuario = usuarios.get(1)  # Aqui pegamos o usuário de ID 1

    if request.method == 'POST':
        # Atualiza os dados do usuário
        usuario["nome"] = request.form['nome']
        usuario["descricao"] = request.form['descricao']
        # Aqui você pode implementar uma funcionalidade para editar a imagem, se necessário

        return redirect(url_for('index'))  # Após editar, volta para a página inicial

    return render_template('editar_usuario.html', usuario=usuario)


if __name__ == "__main__":
    app.run(debug=True)
