import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Search, Truck, DollarSign, TrendingUp, Box } from 'lucide-react';
import { supabase, handleDatabaseError } from '../lib/supabase';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type Carrier = {
  id: string;
  name: string;
  address: string;
  country: string;
  email: string;
  phone: string;
};

type CarrierStats = {
  totalTransports: number;
  activeTransports: number;
  averagePrice: number;
  priceVariation: number;
};

const carrierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
});

type CarrierFormData = z.infer<typeof carrierSchema>;

export default function Carriers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: carriers, isLoading } = useQuery({
    queryKey: ['carriers', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .ilike('name', `%${searchTerm}%`);

      if (error) throw error;
      return data as Carrier[];
    }
  });

  const { data: carrierStats } = useQuery({
    queryKey: ['carrier-stats'],
    queryFn: async () => {
      const sixMonthsAgo = format(new Date().setMonth(new Date().getMonth() - 6), 'yyyy-MM-dd');
      
      const [totalTransports, activeTransports, prices] = await Promise.all([
        supabase
          .from('orders')
          .select('carrier_id', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select('carrier_id', { count: 'exact', head: true })
          .eq('status', 'in_transit'),
        supabase
          .from('orders')
          .select('transport_price, created_at')
          .gte('created_at', sixMonthsAgo)
      ]);

      const stats: Record<string, CarrierStats> = {};
      
      if (prices.data) {
        const pricesByMonth: Record<string, number[]> = {};
        prices.data.forEach((order) => {
          const month = format(new Date(order.created_at), 'yyyy-MM');
          if (!pricesByMonth[month]) {
            pricesByMonth[month] = [];
          }
          if (order.transport_price) {
            pricesByMonth[month].push(order.transport_price);
          }
        });

        const monthlyAverages = Object.values(pricesByMonth).map(prices => 
          prices.reduce((a, b) => a + b, 0) / prices.length
        );

        const averagePrice = monthlyAverages.reduce((a, b) => a + b, 0) / monthlyAverages.length;
        const priceVariation = monthlyAverages.length > 1 
          ? ((monthlyAverages[monthlyAverages.length - 1] - monthlyAverages[0]) / monthlyAverages[0]) * 100
          : 0;

        carriers?.forEach(carrier => {
          stats[carrier.id] = {
            totalTransports: totalTransports.count || 0,
            activeTransports: activeTransports.count || 0,
            averagePrice,
            priceVariation
          };
        });
      }

      return stats;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: CarrierFormData) => {
      const { error } = await supabase
        .from('carriers')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      setIsModalOpen(false);
      setSelectedCarrier(null);
      setError(null);
    },
    onError: async (error) => {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CarrierFormData }) => {
      const { error } = await supabase
        .from('carriers')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      setIsModalOpen(false);
      setSelectedCarrier(null);
      setError(null);
    },
    onError: async (error) => {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('carriers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
    },
    onError: async (error) => {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  });

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transportadora? Esta ação não pode ser desfeita.')) {
      await deleteMutation.mutate(id);
    }
  };

  const handleEdit = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CarrierFormData) => {
    try {
      if (selectedCarrier) {
        await updateMutation.mutateAsync({ id: selectedCarrier.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error saving carrier:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">Transportadoras</h1>
        <button
          onClick={() => {
            setSelectedCarrier(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Transportadora
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Pesquisar transportadoras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-4 text-gray-500">
            Carregando...
          </div>
        ) : carriers?.length === 0 ? (
          <div className="col-span-full text-center py-4 text-gray-500">
            Nenhuma transportadora encontrada
          </div>
        ) : (
          carriers?.map((carrier) => {
            const stats = carrierStats?.[carrier.id];
            return (
              <div key={carrier.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <Truck className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{carrier.name}</h3>
                        <p className="text-sm text-gray-500">{carrier.country}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(carrier)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(carrier.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Box className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Total Transportes</p>
                        <p className="text-lg font-medium">{stats?.totalTransports || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Truck className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Transportes Ativos</p>
                        <p className="text-lg font-medium">{stats?.activeTransports || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Preço Médio</p>
                        <p className="text-lg font-medium">
                          €{stats?.averagePrice.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Variação 6m</p>
                        <p className={`text-lg font-medium ${
                          (stats?.priceVariation || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stats?.priceVariation.toFixed(1) || '0'}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p className="flex items-center">
                      <span className="font-medium mr-2">Email:</span>
                      {carrier.email}
                    </p>
                    <p className="flex items-center">
                      <span className="font-medium mr-2">Telefone:</span>
                      {carrier.phone}
                    </p>
                    <p className="flex items-center">
                      <span className="font-medium mr-2">Morada:</span>
                      {carrier.address}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <CarrierModal
          carrier={selectedCarrier}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCarrier(null);
            setError(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function CarrierModal({
  carrier,
  onClose,
  onSave,
}: {
  carrier: Carrier | null;
  onClose: () => void;
  onSave: (data: CarrierFormData) => Promise<void>;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CarrierFormData>({
    defaultValues: carrier || {
      name: '',
      address: '',
      country: '',
      email: '',
      phone: '',
    }
  });

  const onSubmit = async (data: CarrierFormData) => {
    try {
      const validatedData = carrierSchema.parse(data);
      await onSave(validatedData);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          console.error(`Validation error: ${err.message}`);
        });
      }
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-medium mb-4">
          {carrier ? 'Editar Transportadora' : 'Adicionar Transportadora'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Morada</label>
            <input
              type="text"
              {...register('address')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">País</label>
            <input
              type="text"
              {...register('country')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="tel"
              {...register('phone')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              {carrier ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}