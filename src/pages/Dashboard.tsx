import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Package, Truck, DollarSign, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: containersInTransit },
        { count: ordersInTransit },
        { data: payments },
        { data: nextContainer }
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'in_transit'),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'in_transit'),
        supabase
          .from('orders')
          .select('initial_payment_amount, order_value'),
        supabase
          .from('orders')
          .select('expected_start_date')
          .gt('expected_start_date', new Date().toISOString())
          .order('expected_start_date', { ascending: true })
          .limit(1)
      ]);

      const totalInitialPayment = payments?.reduce(
        (sum, order) => sum + (order.initial_payment_amount || 0),
        0
      );
      const totalPendingPayment = payments?.reduce(
        (sum, order) => sum + (order.order_value || 0) - (order.initial_payment_amount || 0),
        0
      );

      return {
        containersInTransit: containersInTransit || 0,
        ordersInTransit: ordersInTransit || 0,
        totalInitialPayment: totalInitialPayment || 0,
        totalPendingPayment: totalPendingPayment || 0,
        nextContainerDate: nextContainer?.[0]?.expected_start_date
      };
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Contentores em trânsito"
          value={stats?.containersInTransit}
          icon={Truck}
        />
        <DashboardCard
          title="Compras em trânsito"
          value={stats?.ordersInTransit}
          icon={Package}
        />
        <DashboardCard
          title="Total de Pagamentos já feitos"
          value={stats?.totalInitialPayment}
          format="currency"
          icon={DollarSign}
        />
        <DashboardCard
          title="Total de Pagamentos pendentes"
          value={stats?.totalPendingPayment}
          format="currency"
          icon={DollarSign}
        />
      </div>

      {stats?.nextContainerDate && (
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">
              Data Próximo Contentor
            </h2>
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {new Date(stats.nextContainerDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon: Icon,
  format
}: {
  title: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  format?: 'number' | 'currency';
}) {
  const formattedValue = format === 'currency'
    ? new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
      }).format(value || 0)
    : value?.toLocaleString();

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center space-x-3">
        <Icon className="h-6 w-6 text-gray-400" />
        <h2 className="text-sm font-medium text-gray-900">{title}</h2>
      </div>
      <p className="mt-2 text-3xl font-semibold text-gray-900">
        {formattedValue}
      </p>
    </div>
  );
}