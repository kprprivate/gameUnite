from flask import Blueprint, request, current_app, send_from_directory, abort, g
from app.utils.decorators.auth_decorators import jwt_required
from app.utils.helpers.response_helpers import success_response, error_response
from app.services.upload.upload_service import UploadService
import os

upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/<path:filename>")
def serve_file(filename):
    """Serve arquivos de upload (imagens, etc)."""
    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        file_path = os.path.join(upload_folder, filename)

        # Verificar se arquivo existe
        if os.path.exists(file_path):
            return send_from_directory(upload_folder, filename)
        else:
            # Retornar imagem padrão baseada no tipo
            if 'profiles' in filename:
                default_file = 'profiles/medium/no-user-image.jpg'
            elif 'ads' in filename:
                default_file = 'ads/medium/no-ads-image.jpg'
            elif 'games' in filename:
                default_file = 'games/medium/valorant.jpg'
            else:
                default_file = 'ads/medium/no-ads-image.jpg'

            default_path = os.path.join(upload_folder, default_file)
            if os.path.exists(default_path):
                return send_from_directory(upload_folder, default_file)
            else:
                abort(404)

    except Exception as e:
        print(f"Erro ao servir arquivo {filename}: {e}")
        abort(404)


@upload_bp.route("/ad-image", methods=["POST"])
@jwt_required
def upload_ad_image():
    """Upload de imagem para anúncio."""
    try:
        if 'image' not in request.files:
            return error_response("Nenhuma imagem enviada", status_code=400)

        file = request.files['image']
        if file.filename == '':
            return error_response("Nenhuma imagem selecionada", status_code=400)

        # Verificar se há imagem existente para substituir
        replace_existing = request.form.get('replace_existing')

        upload_service = UploadService()
        result = upload_service.upload_local_file(file, 'ads', replace_existing)

        if result["success"]:
            return success_response(
                data=result["data"],
                message=result["message"],
                status_code=201
            )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro no upload: {str(e)}")


@upload_bp.route("/profile-image", methods=["POST"])
@jwt_required
def upload_profile_image():
    """Upload de imagem de perfil."""
    try:
        if 'image' not in request.files:
            return error_response("Nenhuma imagem enviada", status_code=400)

        file = request.files['image']
        if file.filename == '':
            return error_response("Nenhuma imagem selecionada", status_code=400)

        # Verificar se há imagem existente para substituir
        replace_existing = request.form.get('replace_existing')
        if not replace_existing and g.user.get("profile_pic"):
            # Extrair filename da URL atual
            current_url = g.user["profile_pic"]
            if current_url and "upload" in current_url:
                replace_existing = current_url.split('/')[-1]

        upload_service = UploadService()
        result = upload_service.upload_local_file(file, 'profiles', replace_existing)

        if result["success"]:
            # Atualizar URL da imagem no perfil do usuário
            from app.models.user.crud import update_user
            update_result = update_user(g.user["_id"], {
                "profile_pic": result["data"]["main_url"]
            })

            if update_result:
                return success_response(
                    data={
                        **result["data"],
                        "profile_updated": True
                    },
                    message="Foto de perfil atualizada com sucesso",
                    status_code=201
                )
            else:
                return success_response(
                    data=result["data"],
                    message="Upload realizado, mas erro ao atualizar perfil",
                    status_code=201
                )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro no upload: {str(e)}")


@upload_bp.route("/game-image", methods=["POST"])
@jwt_required
def upload_game_image():
    """Upload de imagem para jogo (apenas admin)."""
    try:
        # Verificar se é admin
        if g.user.get("role") not in ["admin", "support"]:
            return error_response("Acesso negado. Apenas administradores podem fazer upload de imagens de jogos.",
                                  status_code=403)

        if 'image' not in request.files:
            return error_response("Nenhuma imagem enviada", status_code=400)

        file = request.files['image']
        if file.filename == '':
            return error_response("Nenhuma imagem selecionada", status_code=400)

        # Verificar se há imagem existente para substituir
        replace_existing = request.form.get('replace_existing')

        # Obter ID do jogo se fornecido (para atualizar automaticamente)
        game_id = request.form.get('game_id')

        upload_service = UploadService()
        result = upload_service.upload_local_file(file, 'games', replace_existing)

        if result["success"]:
            # Se game_id foi fornecido, atualizar a imagem do jogo no banco
            if game_id:
                try:
                    from app.db.mongo_client import db
                    from bson import ObjectId
                    from datetime import datetime

                    # Verificar se o jogo existe
                    game = db.games.find_one({"_id": ObjectId(game_id)})
                    if not game:
                        return error_response("Jogo não encontrado", status_code=404)

                    # Atualizar imagem do jogo
                    update_result = db.games.update_one(
                        {"_id": ObjectId(game_id)},
                        {
                            "$set": {
                                "image_url": result["data"]["main_url"],
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )

                    if update_result.modified_count > 0:
                        # Buscar jogo atualizado
                        updated_game = db.games.find_one({"_id": ObjectId(game_id)})
                        updated_game["_id"] = str(updated_game["_id"])

                        return success_response(
                            data={
                                **result["data"],
                                "game_updated": True,
                                "game": updated_game
                            },
                            message="Imagem do jogo atualizada com sucesso",
                            status_code=201
                        )
                    else:
                        return success_response(
                            data={
                                **result["data"],
                                "game_updated": False
                            },
                            message="Upload realizado, mas erro ao atualizar jogo no banco",
                            status_code=201
                        )

                except Exception as db_error:
                    print(f"Erro ao atualizar jogo no banco: {db_error}")
                    return success_response(
                        data={
                            **result["data"],
                            "game_updated": False,
                            "db_error": str(db_error)
                        },
                        message="Upload realizado, mas erro ao atualizar jogo",
                        status_code=201
                    )
            else:
                # Apenas upload sem atualização de jogo
                return success_response(
                    data=result["data"],
                    message=result["message"],
                    status_code=201
                )
        else:
            return error_response(result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro no upload: {str(e)}")


@upload_bp.route("/delete-image", methods=["DELETE"])
@jwt_required
def delete_image():
    """Deleta uma imagem específica (apenas admin ou dono do conteúdo)."""
    try:
        data = request.json
        if not data or "image_url" not in data:
            return error_response("URL da imagem é obrigatória", status_code=400)

        image_url = data["image_url"]
        category = data.get("category", "ads")  # ads, profiles, games

        # Verificar permissões
        is_admin = g.user.get("role") in ["admin", "support"]

        if category == "games" and not is_admin:
            return error_response("Apenas administradores podem deletar imagens de jogos", status_code=403)

        if category == "profiles":
            # Usuário só pode deletar sua própria foto de perfil
            user_profile_pic = g.user.get("profile_pic", "")
            if image_url not in user_profile_pic and not is_admin:
                return error_response("Você só pode deletar sua própria foto de perfil", status_code=403)

        # Extrair filename da URL
        if "upload/" in image_url:
            filename = image_url.split("/")[-1]
        else:
            return error_response("URL de imagem inválida", status_code=400)

        # Deletar arquivo físico
        upload_service = UploadService()
        delete_result = upload_service.delete_local_file(filename, category)

        if delete_result["success"]:
            # Se for foto de perfil, limpar do usuário
            if category == "profiles" and image_url in g.user.get("profile_pic", ""):
                from app.models.user.crud import update_user
                update_user(g.user["_id"], {"profile_pic": ""})

            # Se for imagem de jogo e game_id foi fornecido, limpar do jogo
            if category == "games" and "game_id" in data:
                try:
                    from app.db.mongo_client import db
                    from bson import ObjectId
                    from datetime import datetime

                    db.games.update_one(
                        {"_id": ObjectId(data["game_id"])},
                        {
                            "$set": {
                                "image_url": "",
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                except Exception as e:
                    print(f"Erro ao limpar imagem do jogo: {e}")

            return success_response(message="Imagem deletada com sucesso")
        else:
            return error_response(delete_result["message"], status_code=400)

    except Exception as e:
        return error_response(f"Erro ao deletar imagem: {str(e)}")


@upload_bp.route("/images/optimize", methods=["POST"])
@jwt_required
def optimize_existing_images():
    """Otimiza imagens existentes criando variações de tamanho (apenas admin)."""
    try:
        # Verificar se é admin
        if g.user.get("role") not in ["admin", "support"]:
            return error_response("Acesso negado", status_code=403)

        data = request.json or {}
        category = data.get("category", "all")  # all, ads, profiles, games

        upload_service = UploadService()
        upload_folder = upload_service.upload_folder

        categories_to_process = []
        if category == "all":
            categories_to_process = ["ads", "profiles", "games"]
        else:
            categories_to_process = [category]

        optimized_count = 0
        errors = []

        for cat in categories_to_process:
            cat_path = os.path.join(upload_folder, cat)
            if not os.path.exists(cat_path):
                continue

            # Buscar arquivos na pasta principal da categoria
            for filename in os.listdir(cat_path):
                if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                    try:
                        original_path = os.path.join(cat_path, filename)

                        # Criar variações de tamanho se não existirem
                        for size_name, size_dims in upload_service.image_sizes.items():
                            size_path = os.path.join(cat_path, size_name, filename)

                            if not os.path.exists(size_path):
                                if upload_service.resize_image(original_path, size_dims, size_path):
                                    optimized_count += 1

                    except Exception as e:
                        errors.append(f"Erro ao otimizar {filename}: {str(e)}")

        message = f"Otimização concluída. {optimized_count} variações criadas."
        if errors:
            message += f" {len(errors)} erros encontrados."

        return success_response(
            data={
                "optimized_count": optimized_count,
                "errors": errors
            },
            message=message
        )

    except Exception as e:
        return error_response(f"Erro na otimização: {str(e)}")


@upload_bp.route("/images/stats", methods=["GET"])
@jwt_required
def get_upload_stats():
    """Retorna estatísticas dos uploads (apenas admin)."""
    try:
        # Verificar se é admin
        if g.user.get("role") not in ["admin", "support"]:
            return error_response("Acesso negado", status_code=403)

        upload_service = UploadService()
        upload_folder = upload_service.upload_folder

        stats = {
            "categories": {},
            "total_files": 0,
            "total_size_mb": 0
        }

        categories = ["ads", "profiles", "games"]

        for category in categories:
            cat_path = os.path.join(upload_folder, category)
            cat_stats = {
                "files": 0,
                "size_mb": 0,
                "sizes": {}
            }

            if os.path.exists(cat_path):
                # Contar arquivos em cada tamanho
                for size_name in ["thumbnail", "medium", "large"]:
                    size_path = os.path.join(cat_path, size_name)
                    size_files = 0
                    size_mb = 0

                    if os.path.exists(size_path):
                        for filename in os.listdir(size_path):
                            if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                                size_files += 1
                                file_path = os.path.join(size_path, filename)
                                try:
                                    file_size = os.path.getsize(file_path) / (1024 * 1024)
                                    size_mb += file_size
                                except:
                                    pass

                    cat_stats["sizes"][size_name] = {
                        "files": size_files,
                        "size_mb": round(size_mb, 2)
                    }

                    cat_stats["files"] += size_files
                    cat_stats["size_mb"] += size_mb

                # Arquivos originais na pasta principal
                for filename in os.listdir(cat_path):
                    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                        cat_stats["files"] += 1
                        file_path = os.path.join(cat_path, filename)
                        try:
                            file_size = os.path.getsize(file_path) / (1024 * 1024)
                            cat_stats["size_mb"] += file_size
                        except:
                            pass

            cat_stats["size_mb"] = round(cat_stats["size_mb"], 2)
            stats["categories"][category] = cat_stats
            stats["total_files"] += cat_stats["files"]
            stats["total_size_mb"] += cat_stats["size_mb"]

        stats["total_size_mb"] = round(stats["total_size_mb"], 2)

        return success_response(data=stats)

    except Exception as e:
        return error_response(f"Erro ao obter estatísticas: {str(e)}")