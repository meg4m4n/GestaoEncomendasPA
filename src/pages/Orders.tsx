import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Calendar, DollarSign, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

type Order = {
  id: string;
  reference: string;
  supplier: { name: string };
  destination: { name: string };
  carrier: { name: string };
  product_description: string;
  container_type: string;
  transport_price: number;
  order_value: number;
  status: 'in_production' | 'in_transit' | 'delivered' | 'pending';
  expected_start_date: string;
  etd: string | null;
  eta: string | null;
  ata: string | null;
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          supplier:supplier_id(name),
          destination:destination_id(name),
          carrier:carrier_id(name)
        `)
        .ilike('reference', `%${searchTerm}%`);

      if (error) throw error;
      return data as Order[];
    }
  });

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

  return (
    <div className="space-y-6">
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

      <div className="relative">
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

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referência</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transportadora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contentor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    A carregar...
                  </td>
                </tr>
              ) : orders?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhuma encomenda encontrada
                  </td>
                </tr>
              ) : (
                orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.supplier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.destination.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.carrier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.container_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Início: {format(new Date(order.expected_start_date), 'dd/MM/yyyy')}</span>
                        </div>
                        {order.eta && (
                          <div className="flex items-center gap-1">
                            <Truck className="h-4 w-4" />
                            <span>ETA: {format(new Date(order.eta), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span>{new Intl.NumberFormat('pt-PT', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(order.order_value || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{new Intl.NumberFormat('pt-PT', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(order.transport_price || 0)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}