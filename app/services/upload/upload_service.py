import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from PIL import Image


class UploadService:
    def __init__(self, app=None):
        self.app = app
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.image_sizes = {
            'thumbnail': (300, 300),
            'medium': (800, 600),
            'large': (1200, 900)
        }

        # Configurações locais (para desenvolvimento)
        self.upload_folder = 'uploads'
        self.base_url = "http://127.0.0.1:5000/api/upload"
        self.create_upload_folders()

    def create_upload_folders(self):
        """Cria pastas de upload se não existirem."""
        folders = ['ads', 'profiles', 'games']
        for folder in folders:
            path = os.path.join(self.upload_folder, folder)
            os.makedirs(path, exist_ok=True)
            for size in self.image_sizes.keys():
                os.makedirs(os.path.join(path, size), exist_ok=True)

    def allowed_file(self, filename):
        """Verifica se o arquivo é permitido."""
        if not filename:
            return False

        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in self.allowed_extensions

    def generate_filename(self, original_filename, category='ads'):
        """Gera nome único para o arquivo."""
        if not original_filename or '.' not in original_filename:
            ext = 'jpg'  # Extensão padrão
        else:
            ext = original_filename.rsplit('.', 1)[1].lower()

        unique_filename = f"{category}_{uuid.uuid4().hex}_{int(datetime.now().timestamp())}.{ext}"
        return secure_filename(unique_filename)

    def resize_image(self, image_path, size, output_path):
        """Redimensiona imagem mantendo proporção."""
        try:
            with Image.open(image_path) as img:
                # Converter para RGB se necessário
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')

                # Redimensionar mantendo proporção
                img.thumbnail(size, Image.Resampling.LANCZOS)

                # Criar nova imagem com fundo branco se necessário
                if img.size != size:
                    new_img = Image.new('RGB', size, (255, 255, 255))
                    paste_x = (size[0] - img.size[0]) // 2
                    paste_y = (size[1] - img.size[1]) // 2
                    new_img.paste(img, (paste_x, paste_y))
                    img = new_img

                img.save(output_path, 'JPEG', quality=85, optimize=True)
                return True
        except Exception as e:
            print(f"Erro ao redimensionar imagem: {e}")
            return False

    def delete_existing_images(self, filename, category='ads'):
        """Remove imagens existentes antes de fazer novo upload."""
        if not filename:
            return True

        try:
            # Extrair apenas o nome do arquivo da URL se necessário
            if filename.startswith('http'):
                filename = filename.split('/')[-1]

            # Remover arquivo original
            original_path = os.path.join(self.upload_folder, category, filename)
            if os.path.exists(original_path):
                os.remove(original_path)
                print(f"Removido arquivo original: {original_path}")

            # Remover versões redimensionadas
            for size_name in self.image_sizes.keys():
                size_path = os.path.join(self.upload_folder, category, size_name, filename)
                if os.path.exists(size_path):
                    os.remove(size_path)
                    print(f"Removido arquivo redimensionado: {size_path}")

            return True
        except Exception as e:
            print(f"Erro ao remover imagens existentes: {e}")
            return False

    def upload_local_file(self, file, category='ads', replace_existing=None):
        """Upload local para desenvolvimento com opção de substituir arquivo existente."""
        try:
            # Verificar se o arquivo é válido
            if not file or not file.filename:
                return {"success": False, "message": "Nenhum arquivo fornecido"}

            if not self.allowed_file(file.filename):
                return {"success": False, "message": "Tipo de arquivo não permitido. Use PNG, JPG, GIF, WebP"}

            # Verificar tamanho
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)

            if file_size > self.max_file_size:
                return {"success": False, "message": "Arquivo muito grande (máximo 10MB)"}

            # Se há arquivo para substituir, remover primeiro
            if replace_existing:
                self.delete_existing_images(replace_existing, category)

            # Gerar nome único
            filename = self.generate_filename(file.filename, category)

            # Criar pasta da categoria se não existir
            category_path = os.path.join(self.upload_folder, category)
            os.makedirs(category_path, exist_ok=True)

            # Salvar arquivo original
            original_path = os.path.join(category_path, filename)
            file.save(original_path)
            print(f"Arquivo salvo em: {original_path}")

            # Gerar versões redimensionadas e URLs corretas
            image_urls = {}

            for size_name, size_dimensions in self.image_sizes.items():
                size_dir = os.path.join(category_path, size_name)
                os.makedirs(size_dir, exist_ok=True)

                output_path = os.path.join(size_dir, filename)

                if self.resize_image(original_path, size_dimensions, output_path):
                    image_urls[size_name] = f"{self.base_url}/{category}/{size_name}/{filename}"
                    print(f"Criada versão {size_name}: {output_path}")

            # URL da imagem original
            image_urls['original'] = f"{self.base_url}/{category}/{filename}"

            return {
                "success": True,
                "message": "Upload realizado com sucesso",
                "data": {
                    "filename": filename,
                    "urls": image_urls,
                    "main_url": image_urls.get('medium', image_urls['original'])
                }
            }

        except Exception as e:
            print(f"Erro detalhado no upload: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": f"Erro no upload: {str(e)}"}

    def delete_local_file(self, filename, category='ads'):
        """Remove arquivo local e suas versões."""
        try:
            if not filename:
                return {"success": False, "message": "Nome do arquivo não fornecido"}

            # Extrair apenas o nome do arquivo da URL se necessário
            if filename.startswith('http'):
                filename = filename.split('/')[-1]

            # Remover arquivo original
            original_path = os.path.join(self.upload_folder, category, filename)
            files_removed = 0

            if os.path.exists(original_path):
                os.remove(original_path)
                files_removed += 1
                print(f"Removido: {original_path}")

            # Remover versões redimensionadas
            for size_name in self.image_sizes.keys():
                size_path = os.path.join(self.upload_folder, category, size_name, filename)
                if os.path.exists(size_path):
                    os.remove(size_path)
                    files_removed += 1
                    print(f"Removido: {size_path}")

            if files_removed > 0:
                return {"success": True, "message": f"Arquivo removido com sucesso ({files_removed} arquivos)"}
            else:
                return {"success": False, "message": "Arquivo não encontrado"}

        except Exception as e:
            print(f"Erro ao remover arquivo: {e}")
            return {"success": False, "message": f"Erro ao remover arquivo: {str(e)}"}

    def get_image_url(self, filename, category='ads', size='medium'):
        """Gera URL para uma imagem existente."""
        if not filename:
            return f"{self.base_url}/{category}/{size}/no-{category[:-1]}-image.jpg"

        if filename.startswith('http'):
            return filename

        return f"{self.base_url}/{category}/{size}/{filename}"

    def validate_image_file(self, file):
        """Valida arquivo de imagem antes do upload."""
        if not file or not file.filename:
            return {"valid": False, "error": "Nenhum arquivo fornecido"}

        if not self.allowed_file(file.filename):
            return {"valid": False, "error": "Tipo de arquivo não permitido"}

        # Verificar tamanho
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size > self.max_file_size:
            size_mb = self.max_file_size / (1024 * 1024)
            return {"valid": False, "error": f"Arquivo muito grande (máximo {size_mb}MB)"}

        return {"valid": True}

    def get_upload_stats(self, category=None):
        """Retorna estatísticas de upload."""
        try:
            stats = {
                "total_files": 0,
                "total_size_mb": 0,
                "categories": {}
            }

            categories = [category] if category else ['ads', 'profiles', 'games']

            for cat in categories:
                cat_path = os.path.join(self.upload_folder, cat)
                cat_stats = {
                    "files": 0,
                    "size_mb": 0,
                    "sizes": {}
                }

                if os.path.exists(cat_path):
                    # Contar arquivos em cada tamanho
                    for size_name in list(self.image_sizes.keys()) + ['original']:
                        if size_name == 'original':
                            size_path = cat_path
                        else:
                            size_path = os.path.join(cat_path, size_name)

                        size_files = 0
                        size_mb = 0

                        if os.path.exists(size_path):
                            for filename in os.listdir(size_path):
                                if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                                    # Evitar contar pastas
                                    file_path = os.path.join(size_path, filename)
                                    if os.path.isfile(file_path):
                                        size_files += 1
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

                cat_stats["size_mb"] = round(cat_stats["size_mb"], 2)
                stats["categories"][cat] = cat_stats
                stats["total_files"] += cat_stats["files"]
                stats["total_size_mb"] += cat_stats["size_mb"]

            stats["total_size_mb"] = round(stats["total_size_mb"], 2)
            return {"success": True, "data": stats}

        except Exception as e:
            return {"success": False, "message": f"Erro ao obter estatísticas: {str(e)}"}

    def optimize_images(self, category=None):
        """Otimiza imagens existentes criando variações de tamanho."""
        try:
            categories = [category] if category else ['ads', 'profiles', 'games']
            optimized_count = 0
            errors = []

            for cat in categories:
                cat_path = os.path.join(self.upload_folder, cat)
                if not os.path.exists(cat_path):
                    continue

                # Buscar arquivos na pasta principal da categoria
                for filename in os.listdir(cat_path):
                    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                        file_path = os.path.join(cat_path, filename)
                        if os.path.isfile(file_path):
                            try:
                                # Criar variações de tamanho se não existirem
                                for size_name, size_dims in self.image_sizes.items():
                                    size_dir = os.path.join(cat_path, size_name)
                                    os.makedirs(size_dir, exist_ok=True)

                                    size_path = os.path.join(size_dir, filename)

                                    if not os.path.exists(size_path):
                                        if self.resize_image(file_path, size_dims, size_path):
                                            optimized_count += 1

                            except Exception as e:
                                errors.append(f"Erro ao otimizar {filename}: {str(e)}")

            return {
                "success": True,
                "data": {
                    "optimized_count": optimized_count,
                    "errors": errors
                },
                "message": f"Otimização concluída. {optimized_count} variações criadas."
            }

        except Exception as e:
            return {"success": False, "message": f"Erro na otimização: {str(e)}"}

