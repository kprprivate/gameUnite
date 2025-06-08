import React, { useState, useEffect } from 'react';
import { Card, LoadingSpinner, Badge, Pagination } from '../Common';
import { useApi } from '../../hooks';
import { Activity, Eye, Shield, AlertTriangle, Clock, User } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const api = useApi();

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/support/admin/audit-logs', {
        params: {
          page: currentPage,
          limit: 20
        }
      });
      setLogs(response.data.logs || []);
      setTotalPages(Math.ceil((response.data.total || 0) / 20));
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      create: Eye,
      update: Shield,
      delete: AlertTriangle,
      read: Activity
    };
    const Icon = icons[action] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'success',
      update: 'warning',
      delete: 'danger',
      read: 'primary'
    };
    return colors[action] || 'secondary';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Logs de Auditoria</h2>
          <p className="text-gray-600">Monitore ações administrativas e eventos de segurança</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <Card className="p-8 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum log encontrado</h3>
          <p className="text-gray-600">Não há logs de auditoria no momento</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recurso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Badge variant={getActionColor(log.action)} className="flex items-center gap-1">
                            {getActionIcon(log.action)}
                            {log.action}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.resource_type}</div>
                      {log.resource_id && (
                        <div className="text-sm text-gray-500">ID: {log.resource_id.slice(-8)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{log.admin_username || 'Sistema'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={log.success ? 'success' : 'danger'}>
                        {log.success ? 'Sucesso' : 'Falha'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default AuditLogs;