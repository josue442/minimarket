import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  BarChart3,
} from 'lucide-react';

interface Stats {
  totalSales: number;
  todaySales: number;
  totalUsers: number;
  totalOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export default function AdminDashboard() {
  const { setPage } = useApp();
  const [stats, setStats] = useState<Stats>({
    totalSales: 0, todaySales: 0, totalUsers: 0, totalOrders: 0,
    lowStockProducts: 0, outOfStockProducts: 0, pendingOrders: 0, deliveredOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [ordersRes, usersRes, productsRes, alertsRes, orderItemsRes] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('products').select('*').eq('is_active', true),
      supabase.from('alerts').select('*, product:products(name)').order('created_at', { ascending: false }).limit(10),
      supabase.from('order_items').select('product_name, quantity, subtotal').order('quantity', { ascending: false }),
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const allOrderItems = orderItemsRes.data || [];

    const totalSales = orders.reduce((s, o) => s + Number(o.total), 0);
    const todayOrders = orders.filter((o) => o.created_at.startsWith(today));
    const todaySales = todayOrders.reduce((s, o) => s + Number(o.total), 0);

    setStats({
      totalSales,
      todaySales,
      totalUsers: usersRes.count || 0,
      totalOrders: orders.length,
      lowStockProducts: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
      outOfStockProducts: products.filter((p) => p.stock === 0).length,
      pendingOrders: orders.filter((o) => o.status === 'pendiente').length,
      deliveredOrders: orders.filter((o) => o.status === 'entregado').length,
    });

    setRecentOrders(orders.slice(0, 5));
    setAlerts(alertsRes.data || []);

    // Top products by quantity sold
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    allOrderItems.forEach((item) => {
      if (!productMap[item.product_name]) {
        productMap[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 };
      }
      productMap[item.product_name].qty += item.quantity;
      productMap[item.product_name].revenue += Number(item.subtotal);
    });
    setTopProducts(Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5));

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Ventas Totales', value: `S/.${stats.totalSales.toFixed(2)}`, icon: <DollarSign className="w-5 h-5" />, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { label: 'Ventas del Día', value: `S/.${stats.todaySales.toFixed(2)}`, icon: <TrendingUp className="w-5 h-5" />, color: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-500/20' },
    { label: 'Usuarios', value: stats.totalUsers.toString(), icon: <Users className="w-5 h-5" />, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    { label: 'Pedidos', value: stats.totalOrders.toString(), icon: <ShoppingCart className="w-5 h-5" />, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
  ];

  const statusColors = {
    pendiente: 'bg-amber-100 text-amber-700',
    en_camino: 'bg-blue-100 text-blue-700',
    entregado: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen general de NovaMarket</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage('admin-products')}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Package className="w-4 h-4" />
            Productos
          </button>
          <button
            onClick={() => setPage('admin-orders')}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Pedidos
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow-xl ${card.shadow}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-white/70 text-xs mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Pedidos recientes
            </h2>
            <button
              onClick={() => setPage('admin-orders')}
              className="text-emerald-600 text-sm font-medium hover:underline"
            >
              Ver todos
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No hay pedidos aún</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Pedido #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      S/.{Number(order.total).toFixed(2)}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status === 'pendiente' ? 'Pendiente' : order.status === 'en_camino' ? 'En camino' : 'Entregado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas
          </h2>
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Sin alertas</p>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`p-3 rounded-xl text-xs ${
                  alert.type === 'out_of_stock' ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400' :
                  alert.type === 'low_stock' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400' :
                  'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400'
                }`}>
                  <p className="font-medium">{alert.message}</p>
                  <p className="opacity-60 mt-0.5">{new Date(alert.created_at).toLocaleDateString('es-PE')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top products & order stats */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Productos más vendidos
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Sin datos de ventas</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.qty} vendidos</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">S/.{p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-emerald-500" />
            Estado de inventario
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Pedidos pendientes</span>
                <span className="font-bold text-amber-600">{stats.pendingOrders}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${stats.totalOrders ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Pedidos entregados</span>
                <span className="font-bold text-emerald-600">{stats.deliveredOrders}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${stats.totalOrders ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Stock bajo</span>
                <span className="font-bold text-red-600">{stats.lowStockProducts}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Agotados</span>
                <span className="font-bold text-red-600">{stats.outOfStockProducts}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-700 rounded-full transition-all" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
