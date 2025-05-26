from flask import Flask, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField
from wtforms.validators import DataRequired, Email

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sua_chave_secreta'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///usuarios.db'

db = SQLAlchemy(app)

# Modelo
class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)

# Formulário
class EditarUsuarioForm(FlaskForm):
    nome = StringField('Nome', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Salvar')

# Rota
@app.route('/editar_usuario/<int:id>', methods=['GET', 'POST'])
def editar_usuario(id):
    usuario = Usuario.query.get_or_404(id)
    form = EditarUsuarioForm(obj=usuario)

    if form.validate_on_submit():
        usuario.nome = form.nome.data
        usuario.email = form.email.data
        db.session.commit()
        return redirect(url_for('editar_usuario', id=usuario.id))

    return render_template('editar_usuario.html', form=form)

# Criação do banco
@app.before_first_request
def criar_tabelas():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
