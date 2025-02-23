import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Package, Truck, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';

type MonthlyStats = {
  month: string;
  totalValue: number;
  containerCount: number;
};

type OrderStats = {
  ordersInTransit: number;
  totalValue: number;
  totalInitialPayment: number;
  totalPendingPayment: number;
  nextContainerDate: string | null;
  averageOrderValue: number;
  totalOrders: number;
};

export default function Dashboard() {
  const { data: stats } = useQuery<OrderStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get all orders in transit
      const { data: ordersInTransit, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'in_transit');

      if (ordersError) throw ordersError;

      // Get all orders for total calculations
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('order_value, initial_payment_amount, expected_start_date')
        .order('expected_start_date', { ascending: true });

      if (allOrdersError) throw allOrdersError;

      const totalValue = allOrders?.reduce((sum, order) => sum + (order.order_value || 0), 0) || 0;
      const totalInitialPayment = allOrders?.reduce((sum, order) => sum + (order.initial_payment_amount || 0), 0) || 0;
      const totalPendingPayment = totalValue - totalInitialPayment;
      const averageOrderValue = allOrders?.length ? totalValue / allOrders.length : 0;

      // Find next container date
      const nextContainer = allOrders?.find(order => 
        order.expected_start_date && new Date(order.expected_start_date) > new Date()
      );

      return {
        ordersInTransit: ordersInTransit?.length || 0,
        totalValue,
        totalInitialPayment,
        totalPendingPayment,
        nextContainerDate: nextContainer?.expected_start_date || null,
        averageOrderValue,
        totalOrders: allOrders?.length || 0
      };
    }
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ['monthly-stats'],
    queryFn: async () => {
      const startDate = subMonths(startOfMonth(new Date()), 11);
      
      const { data: orders } = await supabase
        .from('orders')
        .select('order_value, order_date')
        .gte('order_date', startDate.toISOString())
        .order('order_date', { ascending: true });

      const monthlyData: Record<string, MonthlyStats> = {};
      
      // Initialize all months
      for (let i = 0; i < 12; i++) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        monthlyData[monthKey] = {
          month: format(date, 'MMM yyyy'),
          totalValue: 0,
          containerCount: 0
        };
      }

      // Aggregate data
      orders?.forEach(order => {
        const monthKey = format(new Date(order.order_date), 'yyyy-MM');
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].totalValue += order.order_value || 0;
          monthlyData[monthKey].containerCount += 1;
        }
      });

      return Object.values(monthlyData).reverse();
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Contentores em trânsito"
          value={stats?.ordersInTransit}
          icon={Truck}
        />
        <DashboardCard
          title="Total de Contentores"
          value={stats?.totalOrders}
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
        <DashboardCard
          title="Valor Médio por Contentor"
          value={stats?.averageOrderValue}
          format="currency"
          icon={TrendingUp}
        />
        <DashboardCard
          title="Valor Total de Compras"
          value={stats?.totalValue}
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

      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Volume de Compras e Contentores por Mês
        </h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyStats}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" orientation="left" stroke="#0284c7" />
              <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="totalValue" name="Volume de Compras (€)" fill="#0284c7" />
              <Bar yAxisId="right" dataKey="containerCount" name="Quantidade de Contentores" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
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