import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Calendar, DollarSign, Truck, Pencil, Trash2, Filter, FileText, X } from 'lucide-react';
import { supabase, handleDatabaseError } from '../lib/supabase';
import { format } from 'date-fns';

type Order = {
  id: string;
  reference: string;
  supplier: { name: string } | null;
  destination: { name: string } | null;
  carrier: { name: string } | null;
  product_description: string;
  container_type: string;
  transport_price: number;
  order_value: number;
  status: 'in_production' | 'in_transit' | 'delivered' | 'pending';
  order_date: string;
  ata: string | null;
  documents: OrderDocument[];
};

type OrderDocument = {
  id: string;
  order_id: string;
  name: string;
  file_url: string;
  created_at: string;
};

const orderStatuses = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_production', label: 'Em Produção' },
  { value: 'in_transit', label: 'Em Trânsito' },
  { value: 'delivered', label: 'Entregue' }
];

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error: ordersError } = useQuery({
    queryKey: ['orders', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          id,
          reference,
          supplier:suppliers(name),
          destination:destinations(name),
          carrier:carriers(name),
          product_description,
          container_type,
          transport_price,
          order_value,
          status,
          order_date,
          ata,
          documents:order_documents(*)
        `)
        .order('order_date', { ascending: false });

      if (searchTerm) {
        query = query.ilike('reference', `%${searchTerm}%`);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      return data as Order[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: async (error) => {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  });

  const uploadDocument = async (orderId: string, file: File) => {
    const { data, error: uploadError } = await supabase.storage
      .from('order-documents')
      .upload(`${orderId}/${file.name}`, file);

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('order_documents')
      .insert({
        order_id: orderId,
        name: file.name,
        file_url: data.path
      });

    if (dbError) throw dbError;
  };

  const deleteDocument = async (documentId: string) => {
    const { error } = await supabase
      .from('order_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  };

  const handleDelete = async (order: Order) => {
    const message = `Tem certeza que deseja excluir a encomenda "${order.reference}"?\n\nDetalhes da encomenda:\n- Fornecedor: ${order.supplier?.name || 'N/A'}\n- Destino: ${order.destination?.name || 'N/A'}\n- Estado: ${getStatusText(order.status)}\n\nEsta ação não pode ser desfeita.`;
    
    if (confirm(message)) {
      await deleteMutation.mutate(order.id);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'in_production':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'in_production':
        return 'Em Produção';
      case 'in_transit':
        return 'Em Trânsito';
      case 'delivered':
        return 'Entregue';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  if (ordersError) {
    return (
      <div className="p-4 bg-red-50 text-red-700">
        Erro ao carregar encomendas: {ordersError.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Encomendas</h1>
        <Link
          to="/orders/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Encomenda
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar encomendas por referência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {orderStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-[11px]">
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider w-16">Ações</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Ref.</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Transp.</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Cont.</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Datas</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider w-10">Docs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-2 py-2 text-center text-gray-500">
                    A carregar...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-2 py-2 text-center text-gray-500">
                    Nenhuma encomenda encontrada
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(order)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 inline-flex text-[10px] leading-4 font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                      {order.supplier?.name || 'N/A'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                      {order.destination?.name || 'N/A'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                      {order.carrier?.name || 'N/A'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                      {order.container_type}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Enc: {format(new Date(order.order_date), 'dd/MM/yyyy')}</span>
                        </div>
                        {order.ata && (
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            <span>ATA: {format(new Date(order.ata), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>{new Intl.NumberFormat('pt-PT', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(order.order_value || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{new Intl.NumberFormat('pt-PT', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(order.transport_price || 0)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDocumentModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDocumentModalOpen && selectedOrder && (
        <DocumentModal
          order={selectedOrder}
          onClose={() => {
            setIsDocumentModalOpen(false);
            setSelectedOrder(null);
          }}
          onUpload={uploadDocument}
          onDelete={deleteDocument}
        />
      )}
    </div>
  );
}

function DocumentModal({
  order,
  onClose,
  onUpload,
  onDelete
}: {
  order: Order;
  onClose: () => void;
  onUpload: (orderId: string, file: File) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(order.id, file);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      await onDelete(documentId);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Documentos - {order.reference}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adicionar documento
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Documentos existentes
            </h3>
            <div className="space-y-2">
              {!order.documents?.length ? (
                <p className="text-sm text-gray-500">Nenhum documento encontrado</p>
              ) : (
                order.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                  >
                    <span className="text-sm text-gray-900">{doc.name}</span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`${supabase.storage.from('order-documents').getPublicUrl(doc.file_url).data.publicUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FileText className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
