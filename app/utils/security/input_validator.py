import re
from typing import Any, Dict, List, Optional
from bson import ObjectId

class InputValidator:
    """Classe para validação segura de dados de entrada"""
    
    @staticmethod
    def validate_object_id(value: str) -> bool:
        """Valida se uma string é um ObjectId válido do MongoDB"""
        if not value or not isinstance(value, str):
            return False
        try:
            ObjectId(value)
            return len(value) == 24
        except:
            return False
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Valida formato de email"""
        if not email or not isinstance(email, str):
            return False
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email.strip()) is not None
    
    @staticmethod
    def validate_enum(value: str, allowed_values: List[str]) -> bool:
        """Valida se um valor está em uma lista de valores permitidos"""
        return value in allowed_values if value else False
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 255, allow_html: bool = False) -> str:
        """Sanitiza string removendo caracteres perigosos"""
        if not value or not isinstance(value, str):
            return ""
        
        # Remover espaços em branco no início e fim
        sanitized = value.strip()
        
        # Limitar tamanho
        sanitized = sanitized[:max_length]
        
        # Remover HTML se não permitido
        if not allow_html:
            # Remove tags HTML básicas
            sanitized = re.sub(r'<[^>]+>', '', sanitized)
            
        # Remover caracteres de controle perigosos
        sanitized = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', sanitized)
        
        return sanitized
    
    @staticmethod
    def validate_pagination(page: Any, limit: Any, max_limit: int = 100) -> Dict[str, int]:
        """Valida e normaliza parâmetros de paginação"""
        try:
            page_num = max(1, int(page) if page else 1)
            limit_num = max(1, min(max_limit, int(limit) if limit else 10))
            return {"page": page_num, "limit": limit_num}
        except (ValueError, TypeError):
            return {"page": 1, "limit": 10}
    
    @staticmethod
    def validate_rating(rating: Any) -> bool:
        """Valida se uma avaliação está no range 1-5"""
        try:
            rating_num = int(rating)
            return 1 <= rating_num <= 5
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def validate_support_ticket_data(data: Dict) -> Dict[str, Any]:
        """Valida e sanitiza dados de ticket de suporte"""
        if not isinstance(data, dict):
            raise ValueError("Dados devem ser um objeto JSON válido")
        
        # Campos obrigatórios
        required_fields = ['subject', 'message']
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f"Campo '{field}' é obrigatório")
        
        # Validar e sanitizar campos
        validated = {}
        
        # Subject
        validated['subject'] = InputValidator.sanitize_string(
            data['subject'], max_length=200, allow_html=False
        )
        if not validated['subject']:
            raise ValueError("Assunto não pode estar vazio")
        
        # Message
        validated['message'] = InputValidator.sanitize_string(
            data['message'], max_length=2000, allow_html=False
        )
        if not validated['message']:
            raise ValueError("Mensagem não pode estar vazia")
        
        # Category (opcional)
        valid_categories = ['general', 'technical', 'billing', 'account']
        category = data.get('category', 'general')
        if not InputValidator.validate_enum(category, valid_categories):
            validated['category'] = 'general'
        else:
            validated['category'] = category
        
        # Priority (opcional)
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        priority = data.get('priority', 'medium')
        if not InputValidator.validate_enum(priority, valid_priorities):
            validated['priority'] = 'medium'
        else:
            validated['priority'] = priority
        
        return validated
    
    @staticmethod
    def validate_rating_data(data: Dict) -> Dict[str, Any]:
        """Valida e sanitiza dados de avaliação"""
        if not isinstance(data, dict):
            raise ValueError("Dados devem ser um objeto JSON válido")
        
        # Rating obrigatório
        if 'rating' not in data:
            raise ValueError("Campo 'rating' é obrigatório")
        
        if not InputValidator.validate_rating(data['rating']):
            raise ValueError("Avaliação deve ser um número entre 1 e 5")
        
        validated = {'rating': int(data['rating'])}
        
        # Comment opcional
        if 'comment' in data and data['comment']:
            validated['comment'] = InputValidator.sanitize_string(
                data['comment'], max_length=500, allow_html=False
            )
        
        return validated
    
    @staticmethod
    def validate_game_data(data: Dict) -> Dict[str, Any]:
        """Valida e sanitiza dados de jogo"""
        if not isinstance(data, dict):
            raise ValueError("Dados devem ser um objeto JSON válido")
        
        # Nome obrigatório
        if not data.get('name'):
            raise ValueError("Campo 'name' é obrigatório")
        
        validated = {}
        
        # Name
        validated['name'] = InputValidator.sanitize_string(
            data['name'], max_length=100, allow_html=False
        )
        
        # Description
        if data.get('description'):
            validated['description'] = InputValidator.sanitize_string(
                data['description'], max_length=500, allow_html=False
            )
        
        # Image URL
        if data.get('image_url'):
            image_url = InputValidator.sanitize_string(
                data['image_url'], max_length=500, allow_html=False
            )
            # Validação básica de URL
            if re.match(r'^https?://', image_url):
                validated['image_url'] = image_url
        
        # Platform
        valid_platforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile']
        platform = data.get('platform', 'PC')
        if not InputValidator.validate_enum(platform, valid_platforms):
            validated['platform'] = 'PC'
        else:
            validated['platform'] = platform
        
        return validated
    
    @staticmethod
    def validate_category_data(data: Dict) -> Dict[str, Any]:
        """Valida e sanitiza dados de categoria"""
        if not isinstance(data, dict):
            raise ValueError("Dados devem ser um objeto JSON válido")
        
        # Nome obrigatório
        if not data.get('name'):
            raise ValueError("Campo 'name' é obrigatório")
        
        validated = {}
        
        # Name
        validated['name'] = InputValidator.sanitize_string(
            data['name'], max_length=50, allow_html=False
        )
        
        # Description
        if data.get('description'):
            validated['description'] = InputValidator.sanitize_string(
                data['description'], max_length=200, allow_html=False
            )
        
        return validated