import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { supabase, handleDatabaseError } from '../lib/supabase';
import SupplierModal from '../components/SupplierModal';

type Supplier = {
  id: string;
  name: string;
  address: string;
  country: string;
  email: string;
  phone: string;
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

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">País</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Morada</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  A carregar...
                </td>
              </tr>
            ) : suppliers?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhum fornecedor encontrado
                </td>
              </tr>
            ) : (
              suppliers?.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {supplier.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{supplier.email}</div>
                    <div>{supplier.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setIsModalOpen(true);
                        setError(null);
                      }}
                      className="text-primary-600 hover:text-primary-900 inline-flex items-center mr-4"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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