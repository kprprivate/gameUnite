import React, { useState } from 'react';
import { Modal, Button, Alert } from './index';
import { supportService } from '../../services/supportService';

const RatingModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Por favor, selecione uma avaliação');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await supportService.submitRating(order._id, {
        rating,
        comment: comment.trim() || undefined
      });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao enviar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <Modal onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Avaliar Pedido</h2>
        
        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message="Avaliação enviada com sucesso!" className="mb-4" />}
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium">Detalhes do Pedido</h3>
          <p className="text-sm text-gray-600">Pedido #{order._id?.slice(-8)}</p>
          <p className="text-sm text-gray-600">Total: R$ {order.total_price?.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Como você avalia esta experiência?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-8 h-8 text-2xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {rating === 0 && 'Selecione uma avaliação'}
              {rating === 1 && 'Muito ruim'}
              {rating === 2 && 'Ruim'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bom'}
              {rating === 5 && 'Excelente'}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Compartilhe sua experiência..."
              maxLength={500}
            />
            <div className="mt-1 text-xs text-gray-500">
              {comment.length}/500 caracteres
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || rating === 0}
              loading={loading}
            >
              Enviar Avaliação
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RatingModal;