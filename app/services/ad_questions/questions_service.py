# app/services/ad_questions/questions_service.py - VERSÃO COMPLETA CORRIGIDA
from datetime import datetime
from bson import ObjectId
from app.db.mongo_client import db
from app.models.user.crud import get_user_by_id
from app.services.notification.notification_service import notify_new_question


def ask_question(ad_id, user_id, question, is_public=True):
    """Faz uma pergunta sobre um anúncio."""
    try:
        print(f"📤 Criando pergunta - ad_id: {ad_id}, user_id: {user_id}")

        # Verificar se o anúncio existe
        ad = db.ads.find_one({"_id": ObjectId(ad_id), "status": "active"})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Verificar se não é o próprio anúncio
        if str(ad["user_id"]) == str(user_id):
            return {"success": False, "message": "Você não pode fazer perguntas no seu próprio anúncio"}

        # Criar pergunta
        question_doc = {
            "ad_id": ObjectId(ad_id),
            "user_id": ObjectId(user_id),
            "question": question.strip(),
            "answer": None,
            "answered_by": None,
            "answered_at": None,
            "status": "pending",
            "is_public": is_public,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        print(f"💾 Inserindo pergunta no banco: {question_doc}")

        result = db.ad_questions.insert_one(question_doc)

        # Preparar resposta
        question_doc["_id"] = str(result.inserted_id)
        question_doc["ad_id"] = str(question_doc["ad_id"])
        question_doc["user_id"] = str(question_doc["user_id"])

        # Adicionar dados do usuário
        user = get_user_by_id(str(user_id))
        question_doc["user"] = {
            "username": user["username"] if user else "Usuário",
            "first_name": user.get("first_name", "") if user else "",
            "profile_pic": user.get("profile_pic", "") if user else ""
        }

        print(f"✅ Pergunta criada com sucesso: {result.inserted_id}")

        # Criar notificação para o dono do anúncio
        try:
            questioner_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() if user else "Usuário"
            if not questioner_name:
                questioner_name = user.get('username', 'Usuário') if user else "Usuário"
            
            notify_new_question(
                ad_owner_id=str(ad["user_id"]),
                questioner_name=questioner_name,
                ad_title=ad.get("title", "Anúncio"),
                question_text=question.strip()
            )
        except Exception as notif_error:
            print(f"⚠️ Erro ao criar notificação: {notif_error}")

        return {
            "success": True,
            "data": {"question": question_doc},
            "message": "Pergunta enviada com sucesso"
        }

    except Exception as e:
        print(f"❌ Erro ao criar pergunta: {str(e)}")
        return {"success": False, "message": f"Erro ao enviar pergunta: {str(e)}"}


def answer_question(question_id, user_id, answer):
    """Responde uma pergunta sobre o anúncio."""
    try:
        print(f"📤 Respondendo pergunta - question_id: {question_id}, user_id: {user_id}")

        # Buscar pergunta
        question = db.ad_questions.find_one({"_id": ObjectId(question_id)})
        if not question:
            return {"success": False, "message": "Pergunta não encontrada"}

        # Buscar anúncio
        ad = db.ads.find_one({"_id": question["ad_id"]})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Verificar se é o dono do anúncio
        if str(ad["user_id"]) != str(user_id):
            return {"success": False, "message": "Apenas o dono do anúncio pode responder"}

        # Verificar se já foi respondida
        if question["status"] == "answered":
            return {"success": False, "message": "Pergunta já foi respondida"}

        # Atualizar pergunta com resposta
        update_data = {
            "answer": answer.strip(),
            "answered_by": ObjectId(user_id),
            "answered_at": datetime.utcnow(),
            "status": "answered",
            "updated_at": datetime.utcnow()
        }

        db.ad_questions.update_one(
            {"_id": ObjectId(question_id)},
            {"$set": update_data}
        )

        # Buscar pergunta atualizada
        updated_question = db.ad_questions.find_one({"_id": ObjectId(question_id)})

        # Converter ObjectIds
        updated_question["_id"] = str(updated_question["_id"])
        updated_question["ad_id"] = str(updated_question["ad_id"])
        updated_question["user_id"] = str(updated_question["user_id"])
        updated_question["answered_by"] = str(updated_question["answered_by"])

        # Adicionar dados do usuário que fez a pergunta
        question_user = get_user_by_id(str(updated_question["user_id"]))
        updated_question["user"] = {
            "username": question_user["username"] if question_user else "Usuário",
            "first_name": question_user.get("first_name", "") if question_user else "",
            "profile_pic": question_user.get("profile_pic", "") if question_user else ""
        }

        # Adicionar dados do usuário que respondeu
        answer_user = get_user_by_id(str(updated_question["answered_by"]))
        updated_question["answered_by_user"] = {
            "username": answer_user["username"] if answer_user else "Vendedor",
            "first_name": answer_user.get("first_name", "") if answer_user else "",
            "profile_pic": answer_user.get("profile_pic", "") if answer_user else ""
        }

        print(f"✅ Pergunta respondida com sucesso")

        return {
            "success": True,
            "data": {"question": updated_question},
            "message": "Pergunta respondida com sucesso"
        }

    except Exception as e:
        print(f"❌ Erro ao responder pergunta: {str(e)}")
        return {"success": False, "message": f"Erro ao responder pergunta: {str(e)}"}


def get_user_ad_questions(user_id, limit=20, skip=0, status_filter=None):
    """Busca todas as perguntas dos anúncios de um usuário."""
    try:
        # Buscar anúncios do usuário
        user_ads = list(db.ads.find({"user_id": ObjectId(user_id)}, {"_id": 1, "title": 1}))
        if not user_ads:
            return {
                "success": True,
                "data": {"questions": []},
                "message": "Nenhum anúncio encontrado para este usuário"
            }

        ad_ids = [ad["_id"] for ad in user_ads]
        ad_titles = {str(ad["_id"]): ad["title"] for ad in user_ads}

        # Construir query para buscar perguntas
        query = {"ad_id": {"$in": ad_ids}}
        
        if status_filter:
            query["status"] = status_filter

        # Buscar perguntas com paginação
        questions_cursor = db.ad_questions.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        questions = []
        for question in questions_cursor:
            # Buscar dados do usuário que fez a pergunta
            user = get_user_by_id(str(question["user_id"]))
            
            question_data = {
                "_id": str(question["_id"]),
                "ad_id": str(question["ad_id"]),
                "ad_title": ad_titles.get(str(question["ad_id"]), "Anúncio removido"),
                "question": question["question"],
                "answer": question.get("answer"),
                "status": question["status"],
                "is_public": question.get("is_public", True),
                "created_at": question["created_at"].isoformat(),
                "updated_at": question["updated_at"].isoformat(),
                "answered_at": question["answered_at"].isoformat() if question.get("answered_at") else None,
                "user": {
                    "username": user.get("username", "Usuário") if user else "Usuário",
                    "first_name": user.get("first_name", "") if user else "",
                    "last_name": user.get("last_name", "") if user else "",
                    "profile_pic": user.get("profile_pic", "") if user else ""
                }
            }
            questions.append(question_data)

        total_count = db.ad_questions.count_documents(query)

        return {
            "success": True,
            "data": {
                "questions": questions,
                "total": total_count
            },
            "message": "Perguntas encontradas com sucesso"
        }

    except Exception as e:
        print(f"❌ Erro ao buscar perguntas do usuário: {str(e)}")
        return {"success": False, "message": f"Erro ao buscar perguntas: {str(e)}"}


def get_ad_questions(ad_id, user_id=None):
    """Busca perguntas de um anúncio - CORRIGIDO."""
    try:
        print(f"🔍 Buscando perguntas para anúncio {ad_id}, usuário: {user_id}")

        # Verificar se o anúncio existe
        ad = db.ads.find_one({"_id": ObjectId(ad_id)})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Determinar quais perguntas mostrar
        is_owner = user_id and str(ad["user_id"]) == str(user_id)

        if is_owner:
            # Dono vê todas as perguntas
            query = {"ad_id": ObjectId(ad_id)}
            print("👑 Usuário é dono - mostrando todas as perguntas")
        else:
            # CORREÇÃO: Outros veem perguntas públicas (respondidas OU pendentes) + suas próprias
            if user_id:
                query = {
                    "ad_id": ObjectId(ad_id),
                    "$or": [
                        {"is_public": True},  # Todas as perguntas públicas
                        {"user_id": ObjectId(user_id)}  # Suas próprias perguntas
                    ]
                }
                print("👤 Usuário logado - mostrando perguntas públicas + próprias")
            else:
                # Usuário não logado vê apenas perguntas públicas
                query = {
                    "ad_id": ObjectId(ad_id),
                    "is_public": True
                }
                print("🌐 Usuário não logado - apenas perguntas públicas")

        print(f"🔍 Query MongoDB: {query}")

        # Buscar perguntas
        questions_cursor = db.ad_questions.find(query).sort("created_at", -1)
        questions = []

        for question in questions_cursor:
            try:
                # Converter ObjectIds
                question["_id"] = str(question["_id"])
                question["ad_id"] = str(question["ad_id"])
                question["user_id"] = str(question["user_id"])

                if question.get("answered_by"):
                    question["answered_by"] = str(question["answered_by"])

                # Adicionar dados do usuário que fez a pergunta
                question_user = get_user_by_id(question["user_id"])
                question["user"] = {
                    "username": question_user["username"] if question_user else "Usuário",
                    "first_name": question_user.get("first_name", "") if question_user else "",
                    "profile_pic": question_user.get("profile_pic", "") if question_user else ""
                }

                # Adicionar dados do usuário que respondeu (se respondida)
                if question.get("answered_by"):
                    answer_user = get_user_by_id(question["answered_by"])
                    question["answered_by_user"] = {
                        "username": answer_user["username"] if answer_user else "Vendedor",
                        "first_name": answer_user.get("first_name", "") if answer_user else "",
                        "profile_pic": answer_user.get("profile_pic", "") if answer_user else ""
                    }

                questions.append(question)

            except Exception as question_error:
                print(f"⚠️ Erro ao processar pergunta {question.get('_id')}: {question_error}")
                continue

        print(f"✅ Total de perguntas encontradas: {len(questions)}")

        return {
            "success": True,
            "data": {
                "questions": questions,
                "total": len(questions),
                "is_owner": is_owner
            }
        }

    except Exception as e:
        print(f"❌ Erro ao buscar perguntas: {str(e)}")
        return {"success": False, "message": f"Erro ao buscar perguntas: {str(e)}"}


def get_user_questions(user_id, type="asked"):
    """Busca perguntas do usuário (feitas ou respondidas)."""
    try:
        print(f"🔍 Buscando perguntas do usuário {user_id}, tipo: {type}")

        if type == "asked":
            # Perguntas feitas pelo usuário
            query = {"user_id": ObjectId(user_id)}
        elif type == "answered":
            # Perguntas respondidas pelo usuário
            query = {"answered_by": ObjectId(user_id)}
        else:
            return {"success": False, "message": "Tipo inválido"}

        questions_cursor = db.ad_questions.find(query).sort("created_at", -1)
        questions = []

        for question in questions_cursor:
            try:
                # Converter ObjectIds
                question["_id"] = str(question["_id"])
                question["ad_id"] = str(question["ad_id"])
                question["user_id"] = str(question["user_id"])

                if question.get("answered_by"):
                    question["answered_by"] = str(question["answered_by"])

                # Buscar dados do anúncio
                ad = db.ads.find_one({"_id": ObjectId(question["ad_id"])})
                if ad:
                    question["ad"] = {
                        "title": ad["title"],
                        "status": ad["status"],
                        "image_url": ad.get("image_url", "")
                    }

                # Adicionar dados dos usuários
                if type == "asked":
                    # Para perguntas feitas, mostrar quem respondeu
                    if question.get("answered_by"):
                        answer_user = get_user_by_id(question["answered_by"])
                        question["answered_by_user"] = {
                            "username": answer_user["username"] if answer_user else "Vendedor",
                            "first_name": answer_user.get("first_name", "") if answer_user else ""
                        }
                else:
                    # Para perguntas respondidas, mostrar quem perguntou
                    question_user = get_user_by_id(question["user_id"])
                    question["user"] = {
                        "username": question_user["username"] if question_user else "Usuário",
                        "first_name": question_user.get("first_name", "") if question_user else ""
                    }

                questions.append(question)

            except Exception as question_error:
                print(f"⚠️ Erro ao processar pergunta do usuário {question.get('_id')}: {question_error}")
                continue

        print(f"✅ Perguntas do usuário encontradas: {len(questions)}")

        return {
            "success": True,
            "data": {"questions": questions, "total": len(questions)}
        }

    except Exception as e:
        print(f"❌ Erro ao buscar perguntas do usuário: {str(e)}")
        return {"success": False, "message": f"Erro ao buscar perguntas: {str(e)}"}


def delete_question(question_id, user_id):
    """Deleta uma pergunta (apenas o autor ou dono do anúncio)."""
    try:
        print(f"🗑️ Deletando pergunta {question_id} por usuário {user_id}")

        # Buscar pergunta
        question = db.ad_questions.find_one({"_id": ObjectId(question_id)})
        if not question:
            return {"success": False, "message": "Pergunta não encontrada"}

        # Buscar anúncio
        ad = db.ads.find_one({"_id": question["ad_id"]})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Verificar permissões
        is_question_author = str(question["user_id"]) == str(user_id)
        is_ad_owner = str(ad["user_id"]) == str(user_id)

        if not (is_question_author or is_ad_owner):
            return {"success": False, "message": "Sem permissão para deletar esta pergunta"}

        # Deletar pergunta
        result = db.ad_questions.delete_one({"_id": ObjectId(question_id)})

        if result.deleted_count > 0:
            print(f"✅ Pergunta deletada com sucesso")
            return {"success": True, "message": "Pergunta deletada com sucesso"}
        else:
            return {"success": False, "message": "Erro ao deletar pergunta"}

    except Exception as e:
        print(f"❌ Erro ao deletar pergunta: {str(e)}")
        return {"success": False, "message": f"Erro ao deletar pergunta: {str(e)}"}


def toggle_question_visibility(question_id, user_id):
    """Alterna visibilidade de uma pergunta (apenas dono do anúncio)."""
    try:
        print(f"👁️ Alterando visibilidade da pergunta {question_id}")

        # Buscar pergunta
        question = db.ad_questions.find_one({"_id": ObjectId(question_id)})
        if not question:
            return {"success": False, "message": "Pergunta não encontrada"}

        # Buscar anúncio
        ad = db.ads.find_one({"_id": question["ad_id"]})
        if not ad:
            return {"success": False, "message": "Anúncio não encontrado"}

        # Verificar se é o dono do anúncio
        if str(ad["user_id"]) != str(user_id):
            return {"success": False, "message": "Apenas o dono do anúncio pode alterar a visibilidade"}

        # Alternar visibilidade
        new_visibility = not question["is_public"]

        result = db.ad_questions.update_one(
            {"_id": ObjectId(question_id)},
            {
                "$set": {
                    "is_public": new_visibility,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.modified_count > 0:
            visibility_text = "pública" if new_visibility else "privada"
            print(f"✅ Visibilidade alterada para: {visibility_text}")

            return {
                "success": True,
                "message": f"Pergunta marcada como {visibility_text}",
                "data": {"is_public": new_visibility}
            }
        else:
            return {"success": False, "message": "Erro ao alterar visibilidade"}

    except Exception as e:
        print(f"❌ Erro ao alterar visibilidade: {str(e)}")
        return {"success": False, "message": f"Erro ao alterar visibilidade: {str(e)}"}


# Função auxiliar para validar ObjectId
def validate_object_id(obj_id):
    """Valida se um ID é um ObjectId válido."""
    if not obj_id:
        return False
    try:
        ObjectId(obj_id)
        return True
    except:
        return False


# Funções de debug (para desenvolvimento)
def debug_questions_collection():
    """Função de debug para verificar a collection de perguntas."""
    try:
        total_questions = db.ad_questions.count_documents({})
        public_questions = db.ad_questions.count_documents({"is_public": True})
        answered_questions = db.ad_questions.count_documents({"status": "answered"})

        print(f"📊 Debug - Total de perguntas: {total_questions}")
        print(f"📊 Debug - Perguntas públicas: {public_questions}")
        print(f"📊 Debug - Perguntas respondidas: {answered_questions}")

        # Mostrar algumas perguntas de exemplo
        sample_questions = list(db.ad_questions.find().limit(3))
        for i, q in enumerate(sample_questions, 1):
            print(
                f"📝 Pergunta {i}: {q.get('question', 'N/A')[:50]}... (público: {q.get('is_public')}, status: {q.get('status')})")

        return {
            "total": total_questions,
            "public": public_questions,
            "answered": answered_questions,
            "samples": sample_questions
        }
    except Exception as e:
        print(f"❌ Erro no debug: {str(e)}")
        return None


def reset_questions_collection():
    """CUIDADO: Remove todas as perguntas (apenas para desenvolvimento)."""
    if input("Tem certeza que deseja apagar TODAS as perguntas? (digite 'SIM'): ") == "SIM":
        result = db.ad_questions.delete_many({})
        print(f"🗑️ {result.deleted_count} perguntas deletadas")
        return result.deleted_count
    else:
        print("❌ Operação cancelada")
        return 0