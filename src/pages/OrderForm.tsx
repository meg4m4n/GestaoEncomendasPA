import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

const orderSchema = z.object({
  reference: z.string().min(1, 'Referência é obrigatória'),
  supplier_id: z.string().uuid('Por favor selecione um fornecedor'),
  destination_id: z.string().uuid('Por favor selecione um destino'),
  carrier_id: z.string().uuid('Por favor selecione uma transportadora'),
  product_description: z.string().optional(),
  container_type: z.string().min(1, 'Por favor selecione um tipo de contentor'),
  transport_price: z.number().min(0, 'O preço do transporte deve ser positivo'),
  order_value: z.number().min(0, 'O valor da encomenda deve ser positivo'),
  initial_payment_amount: z.number().min(0, 'O valor do pagamento inicial deve ser positivo').optional().nullable(),
  final_payment_amount: z.number().min(0, 'O valor do pagamento final deve ser positivo').optional().nullable(),
  order_date: z.string().min(1, 'Data da encomenda é obrigatória'),
  expected_shipping_date: z.string().min(1, 'Data prevista de envio é obrigatória'),
  initial_payment_date: z.string().optional().nullable(),
  final_payment_date: z.string().optional().nullable(),
  container_reference: z.string().optional(),
  etd: z.string().optional().nullable(),
  eta: z.string().optional().nullable(),
  ata: z.string().optional().nullable(),
  status: z.enum(['in_production', 'in_transit', 'delivered', 'pending'])
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrderFormData>();

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: destinations } = useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: carriers } = useQuery({
    queryKey: ['carriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('carriers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: containerTypes } = useQuery({
    queryKey: ['container-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('container_types')
        .select('name')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      if (id) {
        const { error } = await supabase
          .from('orders')
          .update(data)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('orders')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders');
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const onSubmit = (data: OrderFormData) => {
    // Ensure dates are in ISO format
    const formattedData = {
      ...data,
      order_date: data.order_date ? new Date(data.order_date).toISOString() : null,
      expected_shipping_date: data.expected_shipping_date ? new Date(data.expected_shipping_date).toISOString() : null,
      initial_payment_date: data.initial_payment_date ? new Date(data.initial_payment_date).toISOString() : null,
      final_payment_date: data.final_payment_date ? new Date(data.final_payment_date).toISOString() : null,
      etd: data.etd ? new Date(data.etd).toISOString() : null,
      eta: data.eta ? new Date(data.eta).toISOString() : null,
      ata: data.ata ? new Date(data.ata).toISOString() : null,
    };
    mutation.mutate(formattedData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Editar Encomenda' : 'Nova Encomenda'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white shadow-sm rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Referência</label>
            <input
              type="text"
              {...register('reference')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.reference && (
              <p className="mt-1 text-sm text-red-600">{errors.reference.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="pending">Pendente</option>
              <option value="in_production">Em Produção</option>
              <option value="in_transit">Em Trânsito</option>
              <option value="delivered">Entregue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
            <select
              {...register('supplier_id')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Selecione um fornecedor</option>
              {suppliers?.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Destino</label>
            <select
              {...register('destination_id')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Selecione um destino</option>
              {destinations?.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Transportadora</label>
            <select
              {...register('carrier_id')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Selecione uma transportadora</option>
              {carriers?.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Contentor</label>
            <select
              {...register('container_type')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Selecione um tipo de contentor</option>
              {containerTypes?.map((type) => (
                <option key={type.name} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Referência do Contentor</label>
            <input
              type="text"
              {...register('container_reference')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição do Produto</label>
            <textarea
              {...register('product_description')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Preço do Transporte (€)</label>
            <input
              type="number"
              step="0.01"
              {...register('transport_price', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valor da Encomenda (€)</label>
            <input
              type="number"
              step="0.01"
              {...register('order_value', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data da Encomenda</label>
            <input
              type="date"
              {...register('order_date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data Prevista de Envio</label>
            <input
              type="date"
              {...register('expected_shipping_date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data Pagamento Inicial</label>
            <input
              type="date"
              {...register('initial_payment_date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valor do Pagamento Inicial (€)</label>
            <input
              type="number"
              step="0.01"
              {...register('initial_payment_amount', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data Pagamento Final</label>
            <input
              type="date"
              {...register('final_payment_date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valor do Pagamento Final (€)</label>
            <input
              type="number"
              step="0.01"
              {...register('final_payment_amount', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ETD</label>
            <input
              type="date"
              {...register('etd')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ETA</label>
            <input
              type="date"
              {...register('eta')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ATA</label>
            <input
              type="date"
              {...register('ata')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
          >
            {id ? 'Atualizar Encomenda' : 'Criar Encomenda'}
          </button>
        </div>
      </form>
    </div>
  );
}