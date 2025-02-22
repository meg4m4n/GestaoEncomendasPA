import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Search, MapPin } from 'lucide-react';
import { supabase, handleDatabaseError } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type Destination = {
  id: string;
  name: string;
  address: string;
  country: string;
  email: string;
  phone: string;
};

const destinationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
});

type DestinationFormData = z.infer<typeof destinationSchema>;

export default function Destinations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: destinations, isLoading } = useQuery({
    queryKey: ['destinations', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .ilike('name', `%${searchTerm}%`);

      if (error) throw error;
      return data as Destination[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: DestinationFormData) => {
      const { error } = await supabase
        .from('destinations')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      setIsModalOpen(false);
      setSelectedDestination(null);
      setError(null);
    },
    onError: async (error) => {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DestinationFormData }) => {
      const { error } = await supabase
        .from('destinations')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      setIsModalOpen(false);
      setSelectedDestination(null);
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
        .from('destinations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
    },
    onError: async (error) => {
      const errorMessage = await handleDatabaseError(error);
      setError(errorMessage);
    }
  });

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este destino? Esta ação não pode ser desfeita.')) {
      await deleteMutation.mutate(id);
    }
  };

  const handleEdit = (destination: Destination) => {
    setSelectedDestination(destination);
    setIsModalOpen(true);
  };

  const handleSave = async (data: DestinationFormData) => {
    try {
      if (selectedDestination) {
        await updateMutation.mutateAsync({ id: selectedDestination.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error saving destination:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">Destinos</h1>
        <button
          onClick={() => {
            setSelectedDestination(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Destino
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Pesquisar destinos..."
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
        ) : destinations?.length === 0 ? (
          <div className="col-span-full text-center py-4 text-gray-500">
            Nenhum destino encontrado
          </div>
        ) : (
          destinations?.map((destination) => (
            <div key={destination.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{destination.name}</h3>
                      <p className="text-sm text-gray-500">{destination.country}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(destination)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(destination.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Morada:</span>
                    {destination.address}
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Email:</span>
                    {destination.email}
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Telefone:</span>
                    {destination.phone}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <DestinationModal
          destination={selectedDestination}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDestination(null);
            setError(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function DestinationModal({
  destination,
  onClose,
  onSave,
}: {
  destination: Destination | null;
  onClose: () => void;
  onSave: (data: DestinationFormData) => Promise<void>;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<DestinationFormData>({
    defaultValues: destination || {
      name: '',
      address: '',
      country: '',
      email: '',
      phone: '',
    }
  });

  const onSubmit = async (data: DestinationFormData) => {
    try {
      const validatedData = destinationSchema.parse(data);
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
          {destination ? 'Editar Destino' : 'Adicionar Destino'}
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
              {destination ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}