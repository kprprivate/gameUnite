from flask import Blueprint, request, current_app
from app.utils.decorators.auth_decorators import jwt_required
from app.utils.helpers.response_helpers import success_response, error_response
from app.services.upload.upload_service import UploadService

upload_bp = Blueprint("upload", __name__)


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

        upload_service = UploadService()
        result = upload_service.upload_local_file(file, 'ads')

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

        upload_service = UploadService()
        result = upload_service.upload_local_file(file, 'profiles')

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