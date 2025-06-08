import React, { useState, useEffect } from 'react';
import { Flag, Eye, Check, X, Clock, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import Button from '../Common/Button';
import Badge from '../Common/Badge';
import { toast } from 'react-toastify';
import { reportsService } from '../../services/reportsService';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, reviewed, resolved, dismissed
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    setLoading(true);
    
    try {
      const filters = {};
      if (filter !== 'all') {
        filters.status = filter;
      }
      
      const result = await reportsService.getReports(filters);
      
      if (result.success) {
        setReports(result.data.reports || []);
      } else {
        toast.error(result.message || 'Erro ao carregar reports');
        setReports([]);
      }
    } catch (error) {
      console.error('Erro ao carregar reports:', error);
      toast.error('Erro ao carregar reports');
      setReports([]);
    }
    
    setLoading(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      spam: 'Spam',
      fake: 'Anúncio falso',
      inappropriate: 'Conteúdo inapropriado',
      scam: 'Tentativa de golpe',
      wrong_category: 'Categoria incorreta',
      other: 'Outro motivo'
    };
    return reasons[reason] || reason;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'primary';
      case 'resolved': return 'success';
      case 'dismissed': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'reviewed': return 'Analisado';
      case 'resolved': return 'Resolvido';
      case 'dismissed': return 'Descartado';
      default: return status;
    }
  };

  const handleStatusChange = async (reportId, newStatus, adminNotes = '') => {
    setActionLoading(prev => ({ ...prev, [reportId]: true }));
    
    try {
      const result = await reportsService.updateReportStatus(reportId, newStatus, adminNotes);
      
      if (result.success) {
        // Reload reports to get updated data
        await loadReports();
        toast.success(`Report ${getStatusLabel(newStatus).toLowerCase()}`);
        setShowModal(false);
        setSelectedReport(null);
      } else {
        toast.error(result.message || 'Erro ao atualizar status do report');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do report');
    }
    
    setActionLoading(prev => ({ ...prev, [reportId]: false }));
  };

  const openReportModal = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const getFilterCounts = () => {
    return {
      all: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      reviewed: reports.filter(r => r.status === 'reviewed').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      dismissed: reports.filter(r => r.status === 'dismissed').length
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
          <Flag className="w-6 h-6 text-red-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Gerenciar Reports
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
          { key: 'all', label: 'Todos', count: counts.all },
          { key: 'pending', label: 'Pendentes', count: counts.pending },
          { key: 'reviewed', label: 'Analisados', count: counts.reviewed },
          { key: 'resolved', label: 'Resolvidos', count: counts.resolved },
          { key: 'dismissed', label: 'Descartados', count: counts.dismissed }
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

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Reportado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.reporter.first_name} {report.reporter.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{report.reporter.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.reported_item_type === 'ad' ? 'Anúncio' : 'Usuário'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {report.reported_item_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getReasonLabel(report.reason)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(report.status)}>
                        {getStatusLabel(report.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(report.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openReportModal(report)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {report.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(report._id, 'resolved')}
                            disabled={actionLoading[report._id]}
                            className="text-green-600 hover:text-green-900"
                            title="Resolver"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(report._id, 'dismissed')}
                            disabled={actionLoading[report._id]}
                            className="text-red-600 hover:text-red-900"
                            title="Descartar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Flag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Nenhum report encontrado
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Ainda não há reports para revisar'
                : `Nenhum report ${getStatusLabel(filter).toLowerCase()}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Detalhes do Report
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reporter
                    </label>
                    <p className="text-gray-900">
                      {selectedReport.reporter.first_name} {selectedReport.reporter.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{selectedReport.reporter.username}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Badge variant={getStatusColor(selectedReport.status)}>
                      {getStatusLabel(selectedReport.status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Reportado
                  </label>
                  <p className="text-gray-900">
                    {selectedReport.reported_item_type === 'ad' ? 'Anúncio' : 'Usuário'} 
                    (ID: {selectedReport.reported_item_id})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo
                  </label>
                  <p className="text-gray-900">{getReasonLabel(selectedReport.reason)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detalhes
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedReport.details || 'Nenhum detalhe fornecido'}
                  </p>
                </div>

                {selectedReport.admin_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas do Admin
                    </label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                      {selectedReport.admin_notes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Criado em
                    </label>
                    <p className="text-gray-900">{formatTime(selectedReport.created_at)}</p>
                  </div>
                  
                  {selectedReport.reviewed_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Revisado em
                      </label>
                      <p className="text-gray-900">{formatTime(selectedReport.reviewed_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedReport.status === 'pending' && (
                <div className="flex space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <Button
                    onClick={() => handleStatusChange(selectedReport._id, 'resolved', 'Report resolvido pelo administrador')}
                    disabled={actionLoading[selectedReport._id]}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Resolver
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange(selectedReport._id, 'dismissed', 'Report descartado - sem violação encontrada')}
                    disabled={actionLoading[selectedReport._id]}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Descartar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;