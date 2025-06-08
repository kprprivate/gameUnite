import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, MapPin, Edit, Save, X, Lock, Camera } from 'lucide-react';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Modal from '../../components/Common/Modal';
import ProfileImageUpload from '../../components/Common/ProfileImageUpload';
import { formatSellerStatus } from '../../utils/helpers';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors }
  } = useForm();

  const newPassword = watch('new_password');

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);

      const result = await userService.getProfile();
      if (result.success) {
        setUserData(result.data.user);
        setProfileImageUrl(result.data.user.profile_pic);
        reset({
          first_name: result.data.user.first_name || '',
          last_name: result.data.user.last_name || '',
          email: result.data.user.email || '',
          phone: result.data.user.phone || '',
          location: result.data.user.location || '',
          bio: result.data.user.bio || ''
        });
      } else {
        toast.error(result.message);
      }

      setLoading(false);
    };

    fetchUserProfile();
  }, [reset]);

  const handleProfileImageUpdate = (newImageUrl) => {
    setProfileImageUrl(newImageUrl);
    // Atualizar userData também para refletir a mudança imediatamente
    if (userData) {
      setUserData({
        ...userData,
        profile_pic: newImageUrl
      });
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);

    const result = await userService.updateProfile(data);
    if (result.success) {
      setUserData(result.data.user);
      toast.success(result.message);
      setIsEditing(false);
    } else {
      toast.error(result.message);
    }

    setIsLoading(false);
  };

  const onPasswordSubmit = async (data) => {
    setIsLoading(true);

    const result = await userService.changePassword({
      current_password: data.current_password,
      new_password: data.new_password
    });

    if (result.success) {
      toast.success(result.message);
      setShowPasswordModal(false);
      resetPassword();
    } else {
      toast.error(result.message);
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    if (userData) {
      reset({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        bio: userData.bio || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Erro ao carregar perfil</h2>
          <p className="text-gray-600">Não foi possível carregar os dados do seu perfil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* COMPONENTE DE UPLOAD DE FOTO DE PERFIL */}
                <div className="mr-6">
                  <ProfileImageUpload
                    currentImage={profileImageUrl}
                    onImageUpdated={handleProfileImageUpdate}
                    size="xl"
                  />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">
                    {userData.first_name} {userData.last_name}
                  </h1>
                  <p className="text-blue-100">@{userData.username}</p>
                  <p className="text-blue-100">
                    Membro desde {new Date(userData.created_at).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right text-white">
                <div className="text-sm">
                  <div>⭐ {formatSellerStatus(userData.seller_rating, userData.total_sales).display} - Vendedor</div>
                  <div>⭐ {userData.buyer_rating?.toFixed(1) || '0.0'}/5 - Comprador</div>
                  <div>{userData.total_ads || 0} anúncios publicados</div>
                  <div>{userData.active_ads || 0} anúncios ativos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Informações Pessoais
              </h2>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    loading={isLoading}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    {...register('first_name', { required: 'Nome é obrigatório' })}
                    type="text"
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing 
                        ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sobrenome
                  </label>
                  <input
                    {...register('last_name', { required: 'Sobrenome é obrigatório' })}
                    type="text"
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing 
                        ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    {...register('email', {
                      required: 'Email é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    disabled={true} // Email não pode ser editado
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 bg-gray-50 rounded-md"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">O email não pode ser alterado</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    {...register('phone')}
                    type="tel"
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                      isEditing 
                        ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localização
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    {...register('location')}
                    type="text"
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                      isEditing 
                        ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    placeholder="Cidade, Estado"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sobre mim
                </label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md ${
                    isEditing 
                      ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Conte um pouco sobre você e seus interesses em jogos..."
                />
              </div>
            </form>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Configurações da Conta
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-gray-800">Alterar Senha</h3>
                <p className="text-sm text-gray-600">Atualize sua senha para manter sua conta segura</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
              >
                <Lock className="w-4 h-4 mr-2" />
                Alterar
              </Button>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-gray-800">Foto de Perfil</h3>
                <p className="text-sm text-gray-600">Clique na sua foto acima para alterá-la</p>
              </div>
              <div className="text-sm text-blue-600">
                {profileImageUrl ? 'Foto definida' : 'Sem foto'}
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-gray-800">Notificações por Email</h3>
                <p className="text-sm text-gray-600">Receba atualizações sobre seus anúncios</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex justify-between items-center py-3">
              <div>
                <h3 className="font-medium text-red-600">Excluir Conta</h3>
                <p className="text-sm text-gray-600">Remova permanentemente sua conta e todos os dados</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => toast.info('Funcionalidade em desenvolvimento')}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Alterar Senha"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePasswordSubmit(onPasswordSubmit)}
              loading={isLoading}
            >
              Alterar Senha
            </Button>
          </>
        }
      >
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual
            </label>
            <input
              {...registerPassword('current_password', { required: 'Senha atual é obrigatória' })}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordErrors.current_password && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <input
              {...registerPassword('new_password', {
                required: 'Nova senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Nova senha deve ter pelo menos 6 caracteres'
                }
              })}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordErrors.new_password && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              {...registerPassword('confirm_password', {
                required: 'Confirmação é obrigatória',
                validate: value => value === newPassword || 'Senhas não coincidem'
              })}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordErrors.confirm_password && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirm_password.message}</p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;