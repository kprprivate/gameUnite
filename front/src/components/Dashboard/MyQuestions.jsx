import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { questionsService } from '../../services/questionsService';
import { 
  MessageCircle, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  User,
  Calendar
} from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import Button from '../Common/Button';
import Badge from '../Common/Badge';
import { toast } from 'react-toastify';

const MyQuestions = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, answered
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [filter]);

  const loadQuestions = async () => {
    setLoading(true);
    
    try {
      const result = await questionsService.getMyAdQuestions({
        limit: 50,
        skip: 0,
        status: filter === 'all' ? undefined : filter
      });

      if (result.success) {
        setQuestions(result.data.questions || []);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
      toast.error('Erro ao carregar perguntas');
    }
    
    setLoading(false);
  };

  const handleAnswerQuestion = async (questionId) => {
    if (!answerText.trim()) {
      toast.error('Digite uma resposta');
      return;
    }

    setSubmittingAnswer(true);
    
    try {
      const result = await questionsService.answerQuestion(questionId, answerText);
      
      if (result.success) {
        setQuestions(prev => 
          prev.map(q => 
            q._id === questionId 
              ? {
                  ...q,
                  answer: answerText,
                  status: 'answered',
                  answered_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              : q
          )
        );
        
        toast.success('Resposta enviada com sucesso!');
        setSelectedQuestion(null);
        setAnswerText('');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao enviar resposta');
    }
    
    setSubmittingAnswer(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    return 'Agora mesmo';
  };

  const filteredQuestions = questions.filter(question => {
    if (filter === 'pending') return question.status === 'pending';
    if (filter === 'answered') return question.status === 'answered';
    return true;
  });

  const getFilterCounts = () => {
    return {
      all: questions.length,
      pending: questions.filter(q => q.status === 'pending').length,
      answered: questions.filter(q => q.status === 'answered').length
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Perguntas dos Anúncios
            </h2>
            <p className="text-gray-600">
              {counts.pending} pendente{counts.pending !== 1 ? 's' : ''} de {counts.all} total
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Todas', count: counts.all },
          { key: 'pending', label: 'Pendentes', count: counts.pending },
          { key: 'answered', label: 'Respondidas', count: counts.answered }
        ].map(filterOption => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <div
              key={question._id}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {question.user.profile_pic ? (
                        <img
                          src={question.user.profile_pic}
                          alt={question.user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {question.user.first_name} {question.user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{question.user.username}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Pergunta sobre:</span>
                    <h3 className="font-semibold text-gray-800">
                      {question.ad_title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={question.status === 'pending' ? 'warning' : 'success'}>
                    {question.status === 'pending' ? (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Respondida
                      </>
                    )}
                  </Badge>
                  
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatTime(question.created_at)}
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">{question.question}</p>
                </div>
              </div>

              {/* Answer Section */}
              {question.status === 'answered' ? (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-blue-600 font-medium mb-1">
                        Sua resposta • {formatTime(question.answered_at)}
                      </div>
                      <p className="text-gray-800">{question.answer}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4">
                  {selectedQuestion === question._id ? (
                    <div className="space-y-3">
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Digite sua resposta..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleAnswerQuestion(question._id)}
                          disabled={submittingAnswer || !answerText.trim()}
                          size="sm"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {submittingAnswer ? 'Enviando...' : 'Enviar Resposta'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedQuestion(null);
                            setAnswerText('');
                          }}
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedQuestion(question._id)}
                      variant="outline"
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Responder
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {filter === 'pending' ? 'Nenhuma pergunta pendente' :
               filter === 'answered' ? 'Nenhuma pergunta respondida' :
               'Nenhuma pergunta encontrada'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Ainda não há perguntas nos seus anúncios'
                : 'Altere o filtro para ver outras perguntas'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQuestions;