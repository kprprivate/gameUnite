import React, { useState } from 'react';
import { Camera, User, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ProfileImageUpload = ({
  currentImage,
  onImageUpdated,
  size = 'lg',
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(currentImage);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const handleFileUpload = async (file) => {
    // Validações
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande (máximo 5MB)');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Se há imagem existente, incluir para substituição
      if (previewImage) {
        const existingFilename = previewImage.split('/').pop();
        formData.append('replace_existing', existingFilename);
      }

      const response = await api.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const imageData = response.data.data;
        setPreviewImage(imageData.main_url);

        if (onImageUpdated) {
          onImageUpdated(imageData.main_url);
        }

        toast.success('Foto de perfil atualizada com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error(error.response?.data?.message || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Input oculto */}
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        id="profile-image-upload"
      />

      {/* Imagem de perfil */}
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative group cursor-pointer`}>
        {previewImage ? (
          <img
            src={previewImage}
            alt="Foto de perfil"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-1/2 h-1/2 text-gray-400" />
        )}

        {/* Overlay de upload */}
        <label
          htmlFor="profile-image-upload"
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center cursor-pointer"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
        </label>
      </div>

      {/* Botão de upload alternativo */}
      <label
        htmlFor="profile-image-upload"
        className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
      >
        <Camera className="w-4 h-4" />
      </label>

      {/* Loading indicator */}
      {uploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;