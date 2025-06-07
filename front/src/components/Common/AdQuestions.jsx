// front/src/components/Ad/AdQuestions.jsx - CORREÇÃO DO RECARREGAMENTO
import React, { useState, useEffect, useCallback } from 'react';
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
import Button from '../../components/Common/Button';

const AdQuestions = ({ ad, isOwner = false }) => {
    const { isAuthenticated, user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [isPublicQuestion, setIsPublicQuestion] = useState(true);
    const [submittingQuestion, setSubmittingQuestion] = useState(false);
    const [answeringQuestion, setAnsweringQuestion] = useState(null);
    const [answerText, setAnswerText] = useState('');
    const [lastLoadTime, setLastLoadTime] = useState(0);

    // CORREÇÃO: useCallback para evitar dependência circular
    const loadQuestions = useCallback(async (force = false) => {
        if (!ad?._id) return;

        // Evitar chamadas múltiplas simultâneas
        const now = Date.now();
        if (!force && (now - lastLoadTime) < 1000) {
            return;
        }

        setLoading(true);
        setLastLoadTime(now);

        try {
            console.log('🔄 Carregando perguntas para anúncio:', ad._id);

            const result = await questionsService.getAdQuestions(ad._id);

            console.log('📥 Resposta da API:', result);

            if (result.success) {
                const questionsData = result.data?.questions || [];
                setQuestions(questionsData);
                console.log('✅ Perguntas carregadas com sucesso:', questionsData.length);
            } else {
                console.error('❌ Erro ao carregar perguntas:', result.message);
                toast.error(result.message);
            }
        } catch (error) {
            console.error('💥 Erro na requisição:', error);
            toast.error('Erro ao carregar perguntas');
        } finally {
            setLoading(false);
        }
    }, [ad?._id, lastLoadTime]);

    useEffect(() => {
        if (ad?._id) {
            loadQuestions(true);
        }
    }, [ad?._id, loadQuestions]);

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
                isPublic: isPublicQuestion
            });

            const result = await questionsService.askQuestion(ad._id, newQuestion.trim(), isPublicQuestion);

            console.log('📥 Resposta do envio:', result);

            if (result.success) {
                toast.success(result.message);
                setNewQuestion('');

                // CORREÇÃO: Aguardar um pouco antes de recarregar para garantir que o backend processou
                setTimeout(async () => {
                    console.log('🔄 Recarregando perguntas após envio...');
                    await loadQuestions(true);
                }, 500);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('💥 Erro ao enviar pergunta:', error);
            toast.error('Erro ao enviar pergunta');
        } finally {
            setSubmittingQuestion(false);
        }
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
            console.log('📤 Enviando resposta para pergunta:', questionId);

            const result = await questionsService.answerQuestion(questionId, answerText.trim());

            console.log('📥 Resposta do envio da resposta:', result);

            if (result.success) {
                toast.success(result.message);
                setAnsweringQuestion(null);
                setAnswerText('');

                // CORREÇÃO: Recarregar após responder
                setTimeout(async () => {
                    console.log('🔄 Recarregando perguntas após resposta...');
                    await loadQuestions(true);
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
            console.log('🗑️ Deletando pergunta:', questionId);

            const result = await questionsService.deleteQuestion(questionId);

            if (result.success) {
                toast.success(result.message);

                // CORREÇÃO: Recarregar após deletar
                setTimeout(async () => {
                    console.log('🔄 Recarregando perguntas após deletar...');
                    await loadQuestions(true);
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
            console.log('👁️ Alterando visibilidade da pergunta:', questionId);

            const result = await questionsService.toggleQuestionVisibility(questionId);

            if (result.success) {
                toast.success(result.message);

                // CORREÇÃO: Recarregar após alterar visibilidade
                setTimeout(async () => {
                    console.log('🔄 Recarregando perguntas após alterar visibilidade...');
                    await loadQuestions(true);
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
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Data inválida';
        }
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

                {/* Botão de recarregar melhorado */}
                <button
                    onClick={() => loadQuestions(true)}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Recarregar perguntas"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Formulário para fazer pergunta */}
            {isAuthenticated && !isOwner && (
                <form onSubmit={handleAskQuestion} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Fazer uma pergunta
                    </h4>

                    <textarea
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Digite sua pergunta sobre este anúncio..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                        maxLength={500}
                        disabled={submittingQuestion}
                    />

                    <div className="flex items-center justify-between mt-3">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPublicQuestion}
                                onChange={(e) => setIsPublicQuestion(e.target.checked)}
                                className="mr-2"
                                disabled={submittingQuestion}
                            />
                            <span className="text-sm text-gray-600">
                <Eye className="w-3 h-3 inline mr-1" />
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
                                disabled={!newQuestion.trim() || newQuestion.length < 10 || submittingQuestion}
                                size="sm"
                                className="inline-flex items-center"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                {submittingQuestion ? 'Enviando...' : 'Enviar Pergunta'}
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

            {/* Debug info (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs">
                    <p><strong>Debug:</strong> {questions.length} perguntas carregadas</p>
                    <p><strong>Último carregamento:</strong> {new Date(lastLoadTime).toLocaleTimeString()}</p>
                    <p><strong>Usuário autenticado:</strong> {isAuthenticated ? 'Sim' : 'Não'}</p>
                    <p><strong>É proprietário:</strong> {isOwner ? 'Sim' : 'Não'}</p>
                </div>
            )}

            {/* Lista de perguntas */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando perguntas...</p>
                </div>
            ) : questions.length === 0 ? (
                <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Nenhuma pergunta ainda</p>
                    <p className="text-sm text-gray-500 mt-2">
                        {isOwner
                            ? 'Quando alguém fizer uma pergunta, ela aparecerá aqui'
                            : 'Seja o primeiro a fazer uma pergunta sobre este anúncio!'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {questions.map((question) => (
                        <div key={question._id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                            {/* Pergunta */}
                            <div className="flex items-start space-x-3 mb-4">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
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

                                <div className="flex-1 min-w-0">
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

                                    <p className="text-gray-800 break-words">{question.question}</p>

                                    {/* Ações da pergunta (para dono do anúncio ou autor) */}
                                    {(isOwner || (user && question.user_id === user._id)) && (
                                        <div className="flex items-center space-x-3 mt-3">
                                            {isOwner && (
                                                <>
                                                    <button
                                                        onClick={() => handleToggleVisibility(question._id)}
                                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center transition-colors"
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
                                                            onClick={() => {
                                                                setAnsweringQuestion(question._id);
                                                                setAnswerText('');
                                                            }}
                                                            className="text-sm text-green-600 hover:text-green-800 transition-colors"
                                                        >
                                                            Responder
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            <button
                                                onClick={() => handleDeleteQuestion(question._id)}
                                                className="text-sm text-red-600 hover:text-red-800 flex items-center transition-colors"
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
                                <div className="ml-11 mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <h5 className="font-medium text-green-800 mb-2">Sua resposta:</h5>
                                    <textarea
                                        value={answerText}
                                        onChange={(e) => setAnswerText(e.target.value)}
                                        placeholder="Digite sua resposta..."
                                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                        rows={3}
                                        maxLength={1000}
                                    />
                                    <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {answerText.length}/1000
                    </span>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    setAnsweringQuestion(null);
                                                    setAnswerText('');
                                                }}
                                                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded"
                                            >
                                                Cancelar
                                            </button>
                                            <Button
                                                onClick={() => handleAnswerQuestion(question._id)}
                                                disabled={!answerText.trim() || answerText.length < 5}
                                                size="sm"
                                            >
                                                Enviar Resposta
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Resposta */}
                            {question.status === 'answered' && question.answer && (
                                <div className="ml-11 pl-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg p-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="font-medium text-green-800">
                      {question.answered_by_user?.first_name || question.answered_by_user?.username || 'Vendedor'}
                    </span>
                                        <span className="text-sm text-gray-500">respondeu</span>
                                        <span className="text-sm text-gray-500">
                      {formatDate(question.answered_at)}
                    </span>
                                    </div>
                                    <p className="text-gray-800 break-words">{question.answer}</p>
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