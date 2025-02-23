import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Search, Building2, Package, Clock, DollarSign } from 'lucide-react';
import { supabase, handleDatabaseError } from '../lib/supabase';
import { differenceInDays } from 'date-fns';
import SupplierModal from '../components/SupplierModal';

type Supplier = {
  id: string;
  name: string;
  address: string;
  country: string;
  email: string;
  phone: string;
};

type SupplierStats = {
  totalOrders: number;
  totalValue: number;
  averageDeliveryTime: number;
};

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .ilike('name', `%${searchTerm}%`);

      if (error) throw error;
      return data as Supplier[];
    }
  });

  const { data: supplierStats } = useQuery({
    queryKey: ['supplier-stats'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('supplier_id, order_value, order_date, expected_shipping_date');

      if (error) throw error;

      const stats: Record<string, SupplierStats> = {};
      
      orders?.forEach(order => {
        if (!stats[order.supplier_id]) {
          stats[order.supplier_id] = {
            totalOrders: 0,
            totalValue: 0,
            averageDeliveryTime: 0
          };
        }

        stats[order.supplier_id].totalOrders++;
        stats[order.supplier_id].totalValue += order.order_value || 0;

        if (order.order_date && order.expected_shipping_date) {
          const deliveryTime = differenceInDays(
            new Date(order.expected_shipping_date),
            new Date(order.order_date)
          );
          const currentTotal = stats[order.supplier_id].averageDeliveryTime * (stats[order.supplier_id].totalOrders - 1);
          stats[order.supplier_id].averageDeliveryTime = (currentTotal + deliveryTime) / stats[order.supplier_id].totalOrders;
        }
      });

      return stats;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Supplier, 'id'>) => {
      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!newSupplier) {
        throw new Error('Erro ao criar fornecedor');
      }

      return newSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
      setSelectedSupplier(null);
      setError(null);
    },
    onError: async (error: any) => {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Supplier) => {
      const { error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
      setSelectedSupplier(null);
      setError(null);
    },
    onError: async (error: any) => {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: async (error: any) => {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  });

  const handleSave = async (data: Omit<Supplier, 'id'>) => {
    try {
      setError(null);
      if (selectedSupplier) {
        await updateMutation.mutateAsync({ ...data, id: selectedSupplier.id });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error: any) {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja eliminar este fornecedor? Esta ação não pode ser desfeita.')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error: any) {
        const errorMessage = await handleDatabaseError(error);
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="space-y-6">
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
        <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
        <button
          onClick={() => {
            setSelectedSupplier(null);
            setIsModalOpen(true);
            setError(null);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Fornecedor
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Pesquisar fornecedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-4 text-gray-500">
            A carregar...
          </div>
        ) : suppliers?.length === 0 ? (
          <div className="col-span-full text-center py-4 text-gray-500">
            Nenhum fornecedor encontrado
          </div>
        ) : (
          suppliers?.map((supplier) => {
            const stats = supplierStats?.[supplier.id] || {
              totalOrders: 0,
              totalValue: 0,
              averageDeliveryTime: 0
            };
            
            return (
              <div key={supplier.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <Building2 className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{supplier.name}</h3>
                        <p className="text-sm text-gray-500">{supplier.country}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setIsModalOpen(true);
                          setError(null);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Total Encomendas</p>
                        <p className="text-lg font-medium">{stats.totalOrders}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Total Comprado</p>
                        <p className="text-lg font-medium">
                          €{stats.totalValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 col-span-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Prazo Médio Entrega</p>
                        <p className="text-lg font-medium">
                          {Math.round(stats.averageDeliveryTime)} dias
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p className="flex items-center">
                      <span className="font-medium mr-2">Email:</span>
                      {supplier.email}
                    </p>
                    <p className="flex items-center">
                      <span className="font-medium mr-2">Telefone:</span>
                      {supplier.phone}
                    </p>
                    <p className="flex items-center">
                      <span className="font-medium mr-2">Morada:</span>
                      {supplier.address}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <SupplierModal
          supplier={selectedSupplier}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSupplier(null);
            setError(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}