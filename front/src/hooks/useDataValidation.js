// front/src/hooks/useDataValidation.js
import { useEffect, useState } from 'react';
import { dataValidation } from '../utils/dataValidation';
import { toast } from 'react-toastify';

export const useDataValidation = (autoClean = true) => {
  const [validationReport, setValidationReport] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (autoClean) {
      performValidation();
    }
  }, [autoClean]);

  const performValidation = async () => {
    setIsValidating(true);

    try {
      const report = dataValidation.generateValidationReport();
      setValidationReport(report);

      // Mostrar notificações se necessário
      if (report.localStorage.cleaned.length > 0) {
        toast.success(`${report.localStorage.cleaned.length} problema(s) de dados corrigido(s)`);
      }

      if (report.localStorage.errors.length > 0) {
        toast.warning(`${report.localStorage.errors.length} erro(s) encontrado(s) durante a validação`);
      }

    } catch (error) {
      console.error('Erro durante validação:', error);
      toast.error('Erro durante validação de dados');
    }

    setIsValidating(false);
  };

  const cleanCart = () => {
    const result = dataValidation.cleanCart();

    if (result.cleaned > 0) {
      toast.success(`${result.cleaned} item(s) inválido(s) removido(s) do carrinho`);
    }

    return result;
  };

  const validateAd = (ad) => {
    return dataValidation.validateAdStructure(ad);
  };

  const isValidObjectId = (id) => {
    return dataValidation.isValidObjectId(id);
  };

  return {
    validationReport,
    isValidating,
    performValidation,
    cleanCart,
    validateAd,
    isValidObjectId
  };
};