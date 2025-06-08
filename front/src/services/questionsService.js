// front/src/services/questionsService.js - CORREÇÃO E MELHORIAS
import api from './api';

export const questionsService = {
  // Buscar perguntas de um anúncio
  async getAdQuestions(adId) {
    try {
      console.log('🔍 Buscando perguntas para anúncio:', adId);

      if (!adId) {
        throw new Error('ID do anúncio é obrigatório');
      }

      const response = await api.get(`/ad-questions/ad/${adId}/questions`);

      console.log('📥 Resposta das perguntas:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Perguntas carregadas'
      };
    } catch (error) {
      console.error('❌ Erro ao buscar perguntas:', error);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao carregar perguntas',
        data: { questions: [] }
      };
    }
  },

  // Fazer uma pergunta
  async askQuestion(adId, question, isPublic = true) {
    try {
      console.log('📤 Enviando pergunta:', { adId, question, isPublic });

      if (!adId || !question) {
        throw new Error('ID do anúncio e pergunta são obrigatórios');
      }

      if (question.trim().length < 10) {
        throw new Error('Pergunta deve ter pelo menos 10 caracteres');
      }

      const requestData = {
        question: question.trim(),
        is_public: isPublic
      };

      console.log('📦 Dados da requisição:', requestData);

      const response = await api.post(`/ad-questions/ad/${adId}/question`, requestData);

      console.log('📥 Resposta do envio:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Pergunta enviada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao enviar pergunta:', error);

      // Log detalhado do erro
      if (error.response) {
        console.error('Dados da resposta de erro:', error.response.data);
        console.error('Status do erro:', error.response.status);
      }

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao enviar pergunta'
      };
    }
  },

  // Responder uma pergunta
  async answerQuestion(questionId, answer) {
    try {
      console.log('📤 Enviando resposta:', { questionId, answer });

      if (!questionId || !answer) {
        throw new Error('ID da pergunta e resposta são obrigatórios');
      }

      if (answer.trim().length < 5) {
        throw new Error('Resposta deve ter pelo menos 5 caracteres');
      }

      const requestData = {
        answer: answer.trim()
      };

      const response = await api.post(`/ad-questions/question/${questionId}/answer`, requestData);

      console.log('📥 Resposta do envio da resposta:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Resposta enviada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao enviar resposta:', error);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao enviar resposta'
      };
    }
  },

  // Deletar uma pergunta
  async deleteQuestion(questionId) {
    try {
      console.log('🗑️ Deletando pergunta:', questionId);

      if (!questionId) {
        throw new Error('ID da pergunta é obrigatório');
      }

      const response = await api.delete(`/ad-questions/question/${questionId}`);

      console.log('📥 Resposta da deleção:', response.data);

      return {
        success: response.data.success || true,
        message: response.data.message || 'Pergunta deletada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao deletar pergunta:', error);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao deletar pergunta'
      };
    }
  },

  // Alterar visibilidade da pergunta
  async toggleQuestionVisibility(questionId) {
    try {
      console.log('👁️ Alterando visibilidade:', questionId);

      if (!questionId) {
        throw new Error('ID da pergunta é obrigatório');
      }

      const response = await api.put(`/ad-questions/question/${questionId}/visibility`);

      console.log('📥 Resposta da alteração:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Visibilidade alterada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao alterar visibilidade:', error);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao alterar visibilidade'
      };
    }
  },

  // Buscar perguntas do usuário
  async getUserQuestions(type = 'asked') {
    try {
      console.log('🔍 Buscando perguntas do usuário:', type);

      if (!['asked', 'answered'].includes(type)) {
        throw new Error('Tipo deve ser "asked" ou "answered"');
      }

      const response = await api.get(`/ad-questions/user/questions?type=${type}`);

      console.log('📥 Perguntas do usuário:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Perguntas carregadas'
      };
    } catch (error) {
      console.error('❌ Erro ao buscar perguntas do usuário:', error);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao carregar perguntas',
        data: { questions: [] }
      };
    }
  },

  // Buscar perguntas dos meus anúncios
  async getMyAdQuestions(params = {}) {
    try {
      console.log('🔍 Buscando perguntas dos meus anúncios:', params);

      const response = await api.get('/ad-questions/my-questions', { params });

      console.log('📥 Perguntas dos meus anúncios:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Perguntas carregadas'
      };
    } catch (error) {
      console.error('❌ Erro ao buscar perguntas dos meus anúncios:', error);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao carregar perguntas',
        data: { questions: [] }
      };
    }
  },

  // Função de debug para verificar conectividade
  async debugConnection() {
    try {
      console.log('🔧 Testando conexão com API de perguntas...');

      // Fazer uma requisição simples para testar
      const response = await api.get('/health');

      console.log('✅ Conexão OK:', response.data);

      return {
        success: true,
        message: 'Conexão estabelecida',
        data: response.data
      };
    } catch (error) {
      console.error('❌ Falha na conexão:', error);

      return {
        success: false,
        message: 'Falha na conexão com a API',
        error: error.message
      };
    }
  },

  // Validar dados antes de enviar
  validateQuestionData(question, isPublic) {
    const errors = [];

    if (!question || typeof question !== 'string') {
      errors.push('Pergunta deve ser um texto válido');
    } else {
      const trimmed = question.trim();
      if (trimmed.length < 10) {
        errors.push('Pergunta deve ter pelo menos 10 caracteres');
      }
      if (trimmed.length > 500) {
        errors.push('Pergunta não pode ter mais de 500 caracteres');
      }
    }

    if (typeof isPublic !== 'boolean') {
      errors.push('Visibilidade deve ser verdadeiro ou falso');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: {
        question: question?.trim(),
        is_public: isPublic
      }
    };
  },

  // Validar dados da resposta
  validateAnswerData(answer) {
    const errors = [];

    if (!answer || typeof answer !== 'string') {
      errors.push('Resposta deve ser um texto válido');
    } else {
      const trimmed = answer.trim();
      if (trimmed.length < 5) {
        errors.push('Resposta deve ter pelo menos 5 caracteres');
      }
      if (trimmed.length > 1000) {
        errors.push('Resposta não pode ter mais de 1000 caracteres');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: {
        answer: answer?.trim()
      }
    };
  }
};