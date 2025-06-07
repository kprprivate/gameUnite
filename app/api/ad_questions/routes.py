from flask import Blueprint, request, g
from app.utils.helpers.response_helpers import success_response, error_response
from app.utils.decorators.auth_decorators import jwt_required
from app.services.ad_questions.questions_service import (
    ask_question, answer_question, get_ad_questions,
    get_user_questions, delete_question, toggle_question_visibility
)

# Criar blueprint
ad_questions_bp = Blueprint("ad_questions", __name__)


@ad_questions_bp.route("/ad/<ad_id>/questions", methods=["GET"])
def get_questions_for_ad(ad_id):
    """Busca perguntas de um anúncio - CORRIGIDO."""
    try:
        # CORREÇÃO: Verificar usuário logado de forma mais robusta
        user_id = None

        # Tentar obter do contexto JWT (se existir)
        if hasattr(g, 'user') and g.user:
            user_id = g.user["_id"]
            print(f"✅ Usuário logado via contexto: {user_id}")
        else:
            # Tentar verificar token manualmente (sem forçar login)
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            try:
                verify_jwt_in_request(optional=True)
                jwt_user_id = get_jwt_identity()
                if jwt_user_id:
                    user_id = jwt_user_id
                    print(f"✅ Usuário logado via JWT opcional: {user_id}")
            except:
                pass  # Usuário não logado, tudo bem

        print(f"🔍 Buscando perguntas para anúncio {ad_id}, usuário: {user_id}")

        result = get_ad_questions(ad_id, user_id)

        if result["success"]:
            return success_response(
                data=result["data"],
                message="Perguntas encontradas"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        print(f"❌ Erro na rota get_questions_for_ad: {str(e)}")
        return error_response(f"Erro ao buscar perguntas: {str(e)}")


@ad_questions_bp.route("/ad/<ad_id>/question", methods=["POST"])
@jwt_required
def ask_question_route(ad_id):
    """Faz uma pergunta sobre um anúncio."""
    try:
        data = request.json
        if not data or "question" not in data:
            return error_response("Pergunta é obrigatória", status_code=400)

        question_text = data["question"].strip()
        if not question_text:
            return error_response("Pergunta não pode estar vazia", status_code=400)

        if len(question_text) < 10:
            return error_response("Pergunta deve ter pelo menos 10 caracteres", status_code=400)

        if len(question_text) > 500:
            return error_response("Pergunta não pode ter mais de 500 caracteres", status_code=400)

        is_public = data.get("is_public", True)

        print(f"📤 Recebendo pergunta - ad_id: {ad_id}, user_id: {g.user['_id']}")

        result = ask_question(ad_id, g.user["_id"], question_text, is_public)

        if result["success"]:
            return success_response(
                data=result["data"],
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        print(f"❌ Erro na rota ask_question: {str(e)}")
        return error_response(f"Erro ao fazer pergunta: {str(e)}")


@ad_questions_bp.route("/question/<question_id>/answer", methods=["POST"])
@jwt_required
def answer_question_route(question_id):
    """Responde uma pergunta."""
    try:
        data = request.json
        if not data or "answer" not in data:
            return error_response("Resposta é obrigatória", status_code=400)

        answer_text = data["answer"].strip()
        if not answer_text:
            return error_response("Resposta não pode estar vazia", status_code=400)

        if len(answer_text) < 5:
            return error_response("Resposta deve ter pelo menos 5 caracteres", status_code=400)

        if len(answer_text) > 1000:
            return error_response("Resposta não pode ter mais de 1000 caracteres", status_code=400)

        print(f"📤 Recebendo resposta - question_id: {question_id}, user_id: {g.user['_id']}")

        result = answer_question(question_id, g.user["_id"], answer_text)

        if result["success"]:
            return success_response(
                data=result["data"],
                message=result["message"]
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        print(f"❌ Erro na rota answer_question: {str(e)}")
        return error_response(f"Erro ao responder pergunta: {str(e)}")


@ad_questions_bp.route("/question/<question_id>", methods=["DELETE"])
@jwt_required
def delete_question_route(question_id):
    """Deleta uma pergunta."""
    try:
        print(f"🗑️ Recebendo deleção - question_id: {question_id}, user_id: {g.user['_id']}")

        result = delete_question(question_id, g.user["_id"])

        if result["success"]:
            return success_response(message=result["message"])
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        print(f"❌ Erro na rota delete_question: {str(e)}")
        return error_response(f"Erro ao deletar pergunta: {str(e)}")


@ad_questions_bp.route("/question/<question_id>/visibility", methods=["PUT"])
@jwt_required
def toggle_question_visibility_route(question_id):
    """Alterna visibilidade de uma pergunta."""
    try:
        print(f"👁️ Recebendo alteração de visibilidade - question_id: {question_id}, user_id: {g.user['_id']}")

        result = toggle_question_visibility(question_id, g.user["_id"])

        if result["success"]:
            return success_response(
                data=result.get("data", {}),
                message=result["message"]
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        print(f"❌ Erro na rota toggle_visibility: {str(e)}")
        return error_response(f"Erro ao alterar visibilidade: {str(e)}")


@ad_questions_bp.route("/user/questions", methods=["GET"])
@jwt_required
def get_user_questions_route():
    """Busca perguntas do usuário."""
    try:
        question_type = request.args.get("type", "asked")  # asked ou answered

        if question_type not in ["asked", "answered"]:
            return error_response("Tipo deve ser 'asked' ou 'answered'", status_code=400)

        print(f"🔍 Buscando perguntas do usuário - user_id: {g.user['_id']}, type: {question_type}")

        result = get_user_questions(g.user["_id"], question_type)

        if result["success"]:
            return success_response(
                data=result["data"],
                message="Perguntas encontradas"
            )
        else:
            return error_response(result["message"])

    except Exception as e:
        print(f"❌ Erro na rota get_user_questions: {str(e)}")
        return error_response(f"Erro ao buscar perguntas: {str(e)}")


# Rota de debug (apenas para desenvolvimento)
@ad_questions_bp.route("/debug/info", methods=["GET"])
def debug_questions_info():
    """Endpoint de debug para verificar estado das perguntas."""
    try:
        import os

        # Só permitir em desenvolvimento
        if os.getenv('FLASK_ENV') != 'development':
            return error_response("Endpoint apenas para desenvolvimento", status_code=403)

        from app.services.ad_questions.questions_service import debug_questions_collection

        debug_info = debug_questions_collection()

        return success_response(
            data=debug_info,
            message="Informações de debug coletadas"
        )

    except Exception as e:
        print(f"❌ Erro no debug: {str(e)}")
        return error_response(f"Erro no debug: {str(e)}")


# Rota para validar dados de entrada
@ad_questions_bp.route("/validate", methods=["POST"])
def validate_question_data():
    """Valida dados de pergunta antes do envio."""
    try:
        data = request.json
        if not data:
            return error_response("Dados inválidos", status_code=400)

        question = data.get("question", "")
        is_public = data.get("is_public", True)

        errors = []

        # Validar pergunta
        if not question or not question.strip():
            errors.append("Pergunta é obrigatória")
        elif len(question.strip()) < 10:
            errors.append("Pergunta deve ter pelo menos 10 caracteres")
        elif len(question.strip()) > 500:
            errors.append("Pergunta não pode ter mais de 500 caracteres")

        # Validar is_public
        if not isinstance(is_public, bool):
            errors.append("Campo 'is_public' deve ser true ou false")

        if errors:
            return error_response("Dados inválidos", errors=errors, status_code=400)

        return success_response(
            data={
                "valid": True,
                "cleaned_question": question.strip(),
                "is_public": is_public
            },
            message="Dados válidos"
        )

    except Exception as e:
        print(f"❌ Erro na validação: {str(e)}")
        return error_response(f"Erro na validação: {str(e)}")


# Health check específico para perguntas
@ad_questions_bp.route("/health", methods=["GET"])
def questions_health_check():
    """Health check específico para o módulo de perguntas."""
    try:
        # Verificar conexão com MongoDB
        from app.db.mongo_client import db

        # Tentar contar documentos
        total_questions = db.ad_questions.count_documents({})

        return success_response(
            data={
                "status": "healthy",
                "total_questions": total_questions,
                "mongodb_connection": "ok"
            },
            message="Módulo de perguntas funcionando"
        )

    except Exception as e:
        print(f"❌ Health check falhou: {str(e)}")
        return error_response(f"Health check falhou: {str(e)}", status_code=503)