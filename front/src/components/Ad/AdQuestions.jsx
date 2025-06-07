// front/src/components/Ad/AdQuestions.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { questionsService } from '../../services/questionsService';
import {
  MessageCircle,
  Send,
  Eye,
  EyeOff,
  Trash2,
  User,
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import Button from '../Common/Button';

const AdQuestions = ({ ad, isOwner = false }) => {
  const { isAuthenticated, user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [isPublicQuestion, setIsPublicQuestion] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');

  // Estado para debug
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (ad?._id) {
      console.log('🔄 Carregando perguntas para anúncio:', ad._id);
      loadQuestions();
    }
  }, [ad?._id]);

  const loadQuestions = async () => {
    if (!ad?._id) {
      console.log('⚠️ ID do anúncio não fornecido');
      return;
    }

    setLoading(true);

    try {
      console.log('📡 Fazendo requisição para perguntas...');

      const result = await questionsService.getAdQuestions(ad._id);

      console.log('📥 Resultado da requisição:', result);

      // Debug info para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        setDebugInfo({
          success: result.success,
          message: result.message,
          questionsCount: result.data?.questions?.length || 0,
          isOwner,
          userId: user?._id,
          adId: ad._id,
          timestamp: new Date().toISOString()
        });
      }

      if (result.success) {
        const questionsData = result.data?.questions || [];
        setQuestions(questionsData);

        console.log('✅ Perguntas carregadas:', {
          total: questionsData.length,
          questions: questionsData.map(q => ({
            id: q._id,
            question: q.question.substring(0, 50) + '...',
            status: q.status,
            isPublic: q.is_public
          }))
        });
      } else {
        console.error('❌ Erro ao carregar perguntas:', result.message);
        toast.error(result.message);
        setQuestions([]);
      }
    } catch (error) {
      console.error('💥 Erro crítico ao carregar perguntas:', error);
      toast.error('Erro ao carregar perguntas');
      setQuestions([]);
    }

    setLoading(false);
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info('Faça login para fazer perguntas');
      return;
    }

    if (!newQuestion.trim()) {
      toast.error('Digite sua pergunta');
      return;
    }

    if (newQuestion.trim().length < 10) {
      toast.error('Pergunta deve ter pelo menos 10 caracteres');
      return;
    }

    setSubmittingQuestion(true);

    try {
      console.log('📤 Enviando pergunta:', {
        adId: ad._id,
        question: newQuestion.trim(),
        isPublic: isPublicQuestion,
        userId: user._id
      });

      const result = await questionsService.askQuestion(
          ad._id,
          newQuestion.trim(),
          isPublicQuestion
      );

      console.log('📥 Resultado do envio:', result);

      if (result.success) {
        toast.success(result.message || 'Pergunta enviada com sucesso');
        setNewQuestion('');

        // Aguardar um pouco antes de recarregar
        setTimeout(() => {
          loadQuestions();
        }, 500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('💥 Erro ao enviar pergunta:', error);
      toast.error('Erro ao enviar pergunta');
    }

    setSubmittingQuestion(false);
  };

  const handleAnswerQuestion = async (questionId) => {
    if (!answerText.trim()) {
      toast.error('Digite sua resposta');
      return;
    }

    if (answerText.trim().length < 5) {
      toast.error('Resposta deve ter pelo menos 5 caracteres');
      return;
    }

    try {
      console.log('📤 Enviando resposta:', {
        questionId,
        answer: answerText.trim()
      });

      const result = await questionsService.answerQuestion(questionId, answerText.trim());

      if (result.success) {
        toast.success(result.message || 'Resposta enviada com sucesso');
        setAnsweringQuestion(null);
        setAnswerText('');

        // Recarregar perguntas após responder
        setTimeout(() => {
          loadQuestions();
        }, 500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('💥 Erro ao responder pergunta:', error);
      toast.error('Erro ao responder pergunta');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta pergunta?')) {
      return;
    }

    try {
      const result = await questionsService.deleteQuestion(questionId);

      if (result.success) {
        toast.success(result.message || 'Pergunta deletada com sucesso');

        // Recarregar perguntas após deletar
        setTimeout(() => {
          loadQuestions();
        }, 500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('💥 Erro ao deletar pergunta:', error);
      toast.error('Erro ao deletar pergunta');
    }
  };

  const handleToggleVisibility = async (questionId) => {
    try {
      const result = await questionsService.toggleQuestionVisibility(questionId);

      if (result.success) {
        toast.success(result.message || 'Visibilidade alterada');

        // Recarregar perguntas após alterar visibilidade
        setTimeout(() => {
          loadQuestions();
        }, 500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('💥 Erro ao alterar visibilidade:', error);
      toast.error('Erro ao alterar visibilidade');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canUserInteract = (question) => {
    if (!user) return false;

    // Dono do anúncio pode fazer tudo
    if (isOwner) return true;

    // Autor da pergunta pode deletar
    if (question.user_id === user._id) return true;

    return false;
  };

  return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">
              Perguntas e Respostas
            </h3>
            <span className="ml-2 bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
            {questions.length}
          </span>
          </div>

          {/* Botão de recarregar */}
          <button
              onClick={loadQuestions}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
              title="Recarregar perguntas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Debug Info (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">🐛 Debug Info</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Success:</strong> {String(debugInfo.success)}</p>
                <p><strong>Message:</strong> {debugInfo.message}</p>
                <p><strong>Questions Count:</strong> {debugInfo.questionsCount}</p>
                <p><strong>Is Owner:</strong> {String(debugInfo.isOwner)}</p>
                <p><strong>User ID:</strong> {debugInfo.userId}</p>
                <p><strong>Ad ID:</strong> {debugInfo.adId}</p>
                <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
              </div>
            </div>
        )}

        {/* Formulário para fazer pergunta */}
        {isAuthenticated && !isOwner && (
            <form onSubmit={handleAskQuestion} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Fazer uma pergunta</h4>

              <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Digite sua pergunta sobre este anúncio..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  maxLength={500}
              />

              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center">
                  <input
                      type="checkbox"
                      checked={isPublicQuestion}
                      onChange={(e) => setIsPublicQuestion(e.target.checked)}
                      className="mr-2"
                  />
                  <span className="text-sm text-gray-600">
                Pergunta pública (outros usuários podem ver)
              </span>
                </label>

                <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {newQuestion.length}/500
              </span>
                  <Button
                      type="submit"
                      loading={submittingQuestion}
                      disabled={!newQuestion.trim() || newQuestion.length < 10}
                      size="sm"
                      className="inline-flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Pergunta
                  </Button>
                </div>
              </div>
            </form>
        )}

        {/* Login prompt */}
        {!isAuthenticated && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-800">
              <a href="/login" className="font-medium hover:underline">
                Faça login
              </a> para fazer perguntas sobre este anúncio
            </span>
              </div>
            </div>
        )}

        {/* Lista de perguntas */}
        {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando perguntas...</p>
            </div>
        ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma pergunta ainda</p>
              <p className="text-sm text-gray-500">
                Seja o primeiro a fazer uma pergunta sobre este anúncio!
              </p>
            </div>
        ) : (
            <div className="space-y-6">
              {questions.map((question) => (
                  <div key={question._id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                    {/* Pergunta */}
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {question.user?.profile_pic ? (
                            <img
                                src={question.user.profile_pic}
                                alt={question.user.username}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <User className="w-4 h-4 text-blue-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {question.user?.first_name || question.user?.username || 'Usuário'}
                    </span>
                          <span className="text-sm text-gray-500">perguntou</span>
                          <span className="text-sm text-gray-500">
                      {formatDate(question.created_at)}
                    </span>

                          {/* Indicadores de visibilidade/status */}
                          <div className="flex items-center space-x-1">
                            {!question.is_public && (
                                <EyeOff className="w-4 h-4 text-gray-400" title="Pergunta privada" />
                            )}
                            {question.status === 'pending' && (
                                <Clock className="w-4 h-4 text-yellow-500" title="Aguardando resposta" />
                            )}
                            {question.status === 'answered' && (
                                <CheckCircle className="w-4 h-4 text-green-500" title="Respondida" />
                            )}
                          </div>
                        </div>

                        <p className="text-gray-800">{question.question}</p>

                        {/* Ações da pergunta */}
                        {canUserInteract(question) && (
                            <div className="flex items-center space-x-3 mt-3">
                              {isOwner && (
                                  <>
                                    <button
                                        onClick={() => handleToggleVisibility(question._id)}
                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                      {question.is_public ? (
                                          <>
                                            <EyeOff className="w-3 h-3 mr-1" />
                                            Tornar Privada
                                          </>
                                      ) : (
                                          <>
                                            <Eye className="w-3 h-3 mr-1" />
                                            Tornar Pública
                                          </>
                                      )}
                                    </button>

                                    {question.status === 'pending' && (
                                        <button
                                            onClick={() => setAnsweringQuestion(question._id)}
                                            className="text-sm text-green-600 hover:text-green-800"
                                        >
                                          Responder
                                        </button>
                                    )}
                                  </>
                              )}

                              <button
                                  onClick={() => handleDeleteQuestion(question._id)}
                                  className="text-sm text-red-600 hover:text-red-800 flex items-center"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Deletar
                              </button>
                            </div>
                        )}
                      </div>
                    </div>

                    {/* Formulário de resposta */}
                    {answeringQuestion === question._id && (
                        <div className="ml-11 mb-4 p-3 bg-green-50 rounded-lg">
                  <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      rows={3}
                  />
                          <div className="flex items-center justify-end space-x-2 mt-2">
                            <button
                                onClick={() => {
                                  setAnsweringQuestion(null);
                                  setAnswerText('');
                                }}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              Cancelar
                            </button>
                            <Button
                                onClick={() => handleAnswerQuestion(question._id)}
                                disabled={!answerText.trim()}
                                size="sm"
                            >
                              Enviar Resposta
                            </Button>
                          </div>
                        </div>
                    )}

                    {/* Resposta */}
                    {question.status === 'answered' && question.answer && (
                        <div className="ml-11 pl-4 border-l-4 border-green-500">
                          <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-green-800">
                      {question.answered_by_user?.first_name || question.answered_by_user?.username || 'Vendedor'}
                    </span>
                            <span className="text-sm text-gray-500">respondeu</span>
                            <span className="text-sm text-gray-500">
                      {formatDate(question.answered_at)}
                    </span>
                          </div>
                          <p className="text-gray-800">{question.answer}</p>
                        </div>
                    )}
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

export default AdQuestions;