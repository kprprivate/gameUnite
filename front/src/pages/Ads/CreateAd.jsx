import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useGames } from '../../contexts/GameContext';
import { adService } from '../../services/adService';
import { Upload, DollarSign, GamePad2 } from 'lucide-react';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const CreateAd = () => {
  const navigate = useNavigate();
  const { games, fetchGames } = useGames();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const adType = watch('ad_type');

  useEffect(() => {
    if (games.length === 0) {
      fetchGames();
    }
  }, [games, fetchGames]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await adService.createAd(data);
      
      if (result.success) {
        toast.success('Anúncio criado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao criar anúncio');
    }
    
    setIsLoading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Criar Novo Anúncio
            </h1>
            <p className="text-gray-600">
              Preencha as informações do seu jogo para criar um anúncio
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Anúncio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Anúncio
              </label>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    {...register('ad_type', { required: 'Selecione o tipo de anúncio' })}
                    type="radio"
                    value="venda"
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Venda</div>
                    <div className="text-sm text-gray-500">Vender o jogo</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    {...register('ad_type', { required: 'Selecione o tipo de anúncio' })}
                    type="radio"
                    value="troca"
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Troca</div>
                    <div className="text-sm text-gray-500">Trocar por outro</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    {...register('ad_type', { required: 'Selecione o tipo de anúncio' })}
                    type="radio"
                    value="procura"
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Procura</div>
                    <div className="text-sm text-gray-500">Procurar para comprar</div>
                  </div>
                </label>
              </div>
              {errors.ad_type && (
                <p className="mt-1 text-sm text-red-600">{errors.ad_type.message}</p>
              )}
            </div>

            {/* Jogo */}
            <div>
              <label htmlFor="game_id" className="block text-sm font-medium text-gray-700 mb-2">
                Jogo
              </label>
              <div className="relative">
                <GamePad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  {...register('game_id', { required: 'Selecione um jogo' })}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.game_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um jogo</option>
                  {games.map((game) => (
                    <option key={game._id} value={game._id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.game_id && (
                <p className="mt-1 text-sm text-red-600">{errors.game_id.message}</p>
              )}
            </div>

            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título do Anúncio
              </label>
              <input
                {...register('title', { 
                  required: 'Título é obrigatório',
                  minLength: {
                    value: 10,
                    message: 'Título deve ter pelo menos 10 caracteres'
                  }
                })}
                type="text"
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: FIFA 24 - PlayStation 5 em perfeito estado"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                {...register('description', { 
                  required: 'Descrição é obrigatória',
                  minLength: {
                    value: 20,
                    message: 'Descrição deve ter pelo menos 20 caracteres'
                  }
                })}
                rows={4}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Descreva o estado do jogo, se possui DLCs, se foi pouco usado, etc."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Preço (apenas para venda) */}
            {adType === 'venda' && (
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Preço (R$)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    {...register('price', { 
                      required: adType === 'venda' ? 'Preço é obrigatório para vendas' : false,
                      min: {
                        value: 1,
                        message: 'Preço deve ser maior que zero'
                      }
                    })}
                    type="number"
                    step="0.01"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0,00"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
            )}

            {/* Jogos desejados (apenas para troca) */}
            {adType === 'troca' && (
              <div>
                <label htmlFor="desired_games" className="block text-sm font-medium text-gray-700 mb-2">
                  Jogos Desejados para Troca
                </label>
                <textarea
                  {...register('desired_games', { 
                    required: adType === 'troca' ? 'Informe os jogos desejados para troca' : false
                  })}
                  rows={3}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.desired_games ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Liste os jogos que você gostaria de receber em troca"
                />
                {errors.desired_games && (
                  <p className="mt-1 text-sm text-red-600">{errors.desired_games.message}</p>
                )}
              </div>
            )}

            {/* Upload de Imagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens do Jogo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg mb-4"
                      />
                      <p className="text-sm text-blue-600 hover:text-blue-500">
                        Clique para alterar a imagem
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600">
                        <span className="text-blue-600 hover:text-blue-500">Clique para fazer upload</span>
                        {' '}ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, GIF até 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Plataforma */}
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
                Plataforma
              </label>
              <select
                {...register('platform', { required: 'Selecione a plataforma' })}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.platform ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione a plataforma</option>
                <option value="PC">PC</option>
                <option value="PlayStation 5">PlayStation 5</option>
                <option value="PlayStation 4">PlayStation 4</option>
                <option value="Xbox Series X/S">Xbox Series X/S</option>
                <option value="Xbox One">Xbox One</option>
                <option value="Nintendo Switch">Nintendo Switch</option>
              </select>
              {errors.platform && (
                <p className="mt-1 text-sm text-red-600">{errors.platform.message}</p>
              )}
            </div>

            {/* Estado do Jogo */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                Estado do Jogo
              </label>
              <select
                {...register('condition', { required: 'Selecione o estado do jogo' })}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.condition ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o estado</option>
                <option value="novo">Novo (lacrado)</option>
                <option value="seminovo">Seminovo (excelente estado)</option>
                <option value="usado">Usado (bom estado)</option>
                <option value="regular">Regular (com sinais de uso)</option>
              </select>
              {errors.condition && (
                <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={isLoading}
              >
                Criar Anúncio
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAd;