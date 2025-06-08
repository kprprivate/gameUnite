import React, { useState, useEffect } from 'react';
import { Button, Modal } from '../Common';
import { useApi } from '../../hooks';
import { 
  User, 
  Mail, 
  UserCheck, 
  Shield, 
  AlertCircle,
  Save,
  X
} from 'lucide-react';

const UserEditModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    bio: '',
    role: 'user',
    is_active: true,
    is_verified: false,
    profile_pic: ''
  });

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        role: user.role || 'user',
        is_active: user.is_active !== false,
        is_verified: user.is_verified || false,
        profile_pic: user.profile_pic || ''
      });
      setImagePreview(user.profile_pic || null);
      setImageFile(null);
      setErrors({}); // Clear any previous errors
    }
  }, [user]);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const api = useApi();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, profile_pic: 'Por favor, selecione apenas arquivos de imagem' });
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, profile_pic: 'Imagem muito grande. Máximo 5MB' });
        return;
      }
      
      setImageFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Limpar erro anterior
      if (errors.profile_pic) {
        const newErrors = { ...errors };
        delete newErrors.profile_pic;
        setErrors(newErrors);
      }
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);
      uploadFormData.append('type', 'profiles');
      
      const response = await api.post('/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success) {
        return response.data.file_url;
      } else {
        throw new Error(response.message || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, profile_pic: '' });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username deve ter pelo menos 3 caracteres';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (formData.first_name && formData.first_name.length < 2) {
      newErrors.first_name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (formData.last_name && formData.last_name.length < 2) {
      newErrors.last_name = 'Sobrenome deve ter pelo menos 2 caracteres';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio não pode ter mais de 500 caracteres';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      let finalFormData = { ...formData };
      
      // Se há uma nova imagem, fazer upload primeiro
      if (imageFile) {
        const imageUrl = await uploadImage();
        finalFormData.profile_pic = imageUrl;
      }
      
      // Prepare data - only send changed fields
      const updateData = {};
      Object.keys(finalFormData).forEach(key => {
        if (finalFormData[key] !== user[key]) {
          updateData[key] = finalFormData[key];
        }
      });
      
      if (Object.keys(updateData).length === 0 && !imageFile) {
        onClose();
        return;
      }
      
      const response = await api.put(`/support/admin/users/${user._id}`, updateData);
      
      if (response.success) {
        onUserUpdated(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: error.message || 'Erro ao atualizar usuário' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageChange = (imageUrl) => {
    handleInputChange('profile_pic', imageUrl);
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Usuário: ${user.username}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-xs">Enviando...</div>
                </div>
              )}
            </div>
            
            {/* Upload Controls */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-300 rounded"
                  >
                    Remover
                  </button>
                )}
              </div>
              
              {/* URL Input alternativo */}
              <div className="w-full max-w-xs">
                <label className="block text-xs text-gray-500 mb-1">
                  Ou cole uma URL:
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.profile_pic}
                  onChange={(e) => {
                    handleInputChange('profile_pic', e.target.value);
                    if (e.target.value && !imageFile) {
                      setImagePreview(e.target.value);
                    }
                  }}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Error display */}
            {errors.profile_pic && (
              <p className="text-red-500 text-xs">{errors.profile_pic}</p>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Username"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.username}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primeiro Nome
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.first_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Primeiro nome"
            />
            {errors.first_name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.first_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sobrenome
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.last_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Sobrenome"
            />
            {errors.last_name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.last_name}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.bio ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Biografia do usuário..."
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{formData.bio.length}/500 caracteres</span>
            {errors.bio && (
              <span className="text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.bio}
              </span>
            )}
          </div>
        </div>

        {/* Role and Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Função
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
              <option value="support">Suporte</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserCheck className="w-4 h-4 inline mr-2" />
              Status
            </label>
            <select
              value={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={true}>Ativo</option>
              <option value={false}>Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verificado
            </label>
            <select
              value={formData.is_verified}
              onChange={(e) => handleInputChange('is_verified', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={true}>Verificado</option>
              <option value={false}>Não Verificado</option>
            </select>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{errors.submit}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || uploading}
          >
            <Save className="w-4 h-4 mr-2" />
            {uploading ? 'Fazendo upload...' : loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserEditModal;