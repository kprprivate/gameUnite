import React, { useState, useRef } from 'react';
import { Upload, X, FileImage, Camera, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ImageUpload = ({
  onImageUploaded,
  currentImage = null,
  category = 'ads',
  className = '',
  maxSize = 10,
  acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  placeholder = 'Clique para fazer upload ou arraste uma imagem',
  allowRemove = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(currentImage);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Verificar tipo
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use PNG, JPG, GIF ou WebP.');
      return false;
    }

    // Verificar tamanho (em MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`Arquivo muito grande. Máximo ${maxSize}MB.`);
      return false;
    }

    return true;
  };

  const handleFileUpload = async (file) => {
    if (!validateFile(file)) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Se há imagem existente, incluir para substituição
      if (previewImage) {
        // Extrair filename da URL existente
        const existingFilename = previewImage.split('/').pop();
        formData.append('replace_existing', existingFilename);
      }

      const endpoint = category === 'profiles' ? '/upload/profile-image' : '/upload/ad-image';
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const imageData = response.data.data;
        setPreviewImage(imageData.main_url);

        if (onImageUploaded) {
          onImageUploaded(imageData);
        }

        toast.success(response.data.message || 'Imagem enviada com sucesso!');
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

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const removeImage = () => {
    setPreviewImage(null);
    if (onImageUploaded) {
      onImageUploaded(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input File Oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Área de Upload */}
      <div
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300
          ${dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        {previewImage ? (
          // Preview da Imagem
          <div className="relative">
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />

            {/* Botões de Ação */}
            <div className="absolute top-2 right-2 flex space-x-1">
              {allowRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Remover imagem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                title="Trocar imagem"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Overlay para Trocar */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 rounded-lg flex items-center justify-center">
              <div className="text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Clique para trocar</p>
              </div>
            </div>
          </div>
        ) : (
          // Estado Vazio
          <div className="py-8">
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-sm text-gray-600">Enviando imagem...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <FileImage className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF ou WebP até {maxSize}MB
                </p>
              </div>
            )}
          </div>
        )}

        {/* Indicador de Drag Over */}
        {dragOver && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-75 rounded-lg flex items-center justify-center">
            <div className="text-blue-600">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Solte a imagem aqui</p>
            </div>
          </div>
        )}
      </div>

      {/* Instruções */}
      {!previewImage && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Recomendamos imagens com resolução mínima de 800x600 pixels
        </p>
      )}
    </div>
  );
};

export default ImageUpload;