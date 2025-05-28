import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { User, Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react';
import Button from '../../components/Common/Button';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      first_name: 'João',
      last_name: 'Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      location: 'São Paulo, SP',
      bio: 'Gamer apaixonado por RPGs e jogos de esporte. Sempre em busca de novas experiências.'
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Implementar chamada para API de atualização de perfil
      console.log('Updating profile:', data);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
    
    setIsLoading(false);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mr-6">
                  <User className="w-10 h-10 text-gray-600" />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">João Silva</h1>
                  <p className="text-blue-100">@joaosilva</p>
                  <p className="text-blue-100">Membro desde Janeiro 2024</p>
                </div>
              </div>
              <div className="text-right text-white">
                <div className="text-sm">
                  <div>⭐ 4.8/5 - Avaliação</div>
                  <div>15 anúncios publicados</div>
                  <div>12 vendas concluídas</div>
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
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                      isEditing 
                        ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
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
              <Button variant="outline" size="sm">
                Alterar
              </Button>
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
              <Button variant="danger" size="sm">
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;