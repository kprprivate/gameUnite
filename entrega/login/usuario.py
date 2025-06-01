from flask import Flask, render_template

app = Flask(__name__)

@app.route('/editar_usuario')
def editar_usuario():
    usuario = {
        "nome": "Henrique",
        "descricao": "Desenvolvedor"
    }  # ou None, para testar
    return render_template('editar_usuario.html', usuario=usuario)

if __name__ == '__main__':
    app.run(debug=True)
