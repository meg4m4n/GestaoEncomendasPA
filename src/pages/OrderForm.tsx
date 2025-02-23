import { useState, useEffect } from 'react';
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

type OrderDocument = {
  id: string;
  order_id: string;
  name: string;
  file_url: string;
  created_at: string;
};

type Order = {
  id: string;
  reference: string;
  supplier_id: string;
  destination_id: string;
  carrier_id: string;
  product_description: string;
  container_type: string;
  transport_price: number;
  order_value: number;
  status: 'in_production' | 'in_transit' | 'delivered' | 'pending';
  order_date: string;
  expected_shipping_date: string;
  initial_payment_date: string | null;
  final_payment_date: string | null;
  container_reference: string;
  etd: string | null;
  eta: string | null;
  ata: string | null;
  // Use o nome do relacionamento detectado no cache do esquema:
  order_documents_order_id_fkey?: OrderDocument[];
};

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  // Estado para armazenar o arquivo a ser enviado
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrderFormData>();

  // Busca os dados da encomenda com os documentos embutidos usando o relacionamento detectado
  const { data: order } = useQuery<Order | null>({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_documents_order_id_fkey(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Quando estiver editando, preenche o formulário com os dados carregados
  useEffect(() => {
    if (order) {
      const formData = {
        ...order,
        order_date: order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : '',
        expected_shipping_date: order.expected_shipping_date ? new Date(order.expected_shipping_date).toISOString().split('T')[0] : '',
        initial_payment_date: order.initial_payment_date ? new Date(order.initial_payment_date).toISOString().split('T')[0] : '',
        final_payment_date: order.final_payment_date ? new Date(order.final_payment_date).toISOString().split('T')[0] : '',
        etd: order.etd ? new Date(order.etd).toISOString().split('T')[0] : '',
        eta: order.eta ? new Date(order.eta).toISOString().split('T')[0] : '',
        ata: order.ata ? new Date(order.ata).toISOString().split('T')[0] : ''
      };
      reset(formData);
    }
  }, [order, reset]);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: destinations } = useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('destinations').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: carriers } = useQuery({
    queryKey: ['carriers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('carriers').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: containerTypes } = useQuery({
    queryKey: ['container-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('container_types').select('name').order('name');
      if (error) throw error;
      return data;
    }
  });

  // Mutação para criar ou atualizar a encomenda
  const mutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      if (id) {
        const { error } = await supabase.from('orders').update(data).eq('id', id);
        if (error) throw error;
        return id;
      } else {
        const { data: insertedData, error } = await supabase.from('orders').insert(data).select().single();
        if (error) throw error;
        return insertedData.id;
      }
    },
    onSuccess: async (orderId: string) => {
      // Se um arquivo foi selecionado, faz o upload e insere o registro do documento
      if (file) {
        const { data: storageData, error: uploadError } = await supabase
          .storage.from('order-documents')
          .upload(`${orderId}/${file.name}`, file);
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          setError(uploadError.message);
          return;
        }
        const { error: docError } = await supabase.from('order_documents').insert({
          order_id: orderId,
          name: file.name,
          file_url: storageData.path
        });
        if (docError) {
          console.error('Error inserting document record:', docError);
          setError(docError.message);
          return;
        }
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      navigate('/orders');
    },
    onError: (error: any) => {
      setError(error.message);
    }
  });

  const onSubmit = (data: OrderFormData) => {
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

  // Função para tratar a seleção do arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Mutação para atualizar registros de documentos
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ documentId, newName }: { documentId: string, newName: string }) => {
      const { error } = await supabase.from('order_documents').update({ name: newName }).eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (error: any) => {
      setError(error.message);
    }
  });

  // Mutação para excluir registros de documentos
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase.from('order_documents').delete().eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (error: any) => {
      setError(error.message);
    }
  });

  const handleDocumentUpdate = (documentId: string, newName: string) => {
    updateDocumentMutation.mutate({ documentId, newName });
  };

  const handleDocumentDelete = (documentId: string) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      deleteDocumentMutation.mutate(documentId);
    }
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
          {/* Campos de input existentes */}
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

        {/* Campo de upload de arquivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Documento</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500"
          />
        </div>

        {/* Listagem dos documentos enviados (usando a propriedade order_documents_order_id_fkey) */}
        {order && order.order_documents_order_id_fkey && order.order_documents_order_id_fkey.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Documentos Carregados</h3>
            {order.order_documents_order_id_fkey.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 border p-2 rounded-md">
                <a
                  href={supabase.storage.from('order-documents').getPublicUrl(doc.file_url).data.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  {doc.name}
                </a>
                <input
                  type="text"
                  defaultValue={doc.name}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value !== doc.name) {
                      handleDocumentUpdate(doc.id, e.target.value);
                    }
                  }}
                  className="border border-gray-300 rounded-md p-1 text-sm"
                />
                <button
                  onClick={() => handleDocumentDelete(doc.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}

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
