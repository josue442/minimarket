import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import type { Order } from '../types';
import { Truck, CheckCircle, Clock, Eye, X } from 'lucide-react';

export default function AdminOrdersPage() {
  const { addNotification } = useApp();
  const [orders, setOrders] = useState<(Order & { items: any[]; user_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: any[]; user_name: string }) | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersData) {
      const enriched = await Promise.all(
        ordersData.map(async (order) => {
          const [itemsRes, profileRes] = await Promise.all([
            supabase.from('order_items').select('*').eq('order_id', order.id),
            supabase.from('profiles').select('full_name').eq('id', order.user_id).maybeSingle(),
          ]);
          return {
            ...order,
            items: itemsRes.data || [],
            user_name: profileRes.data?.full_name || 'Usuario',
          };
        })
      );
      setOrders(enriched);
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      addNotification('error', 'Error al actualizar estado');
    } else {
      addNotification('success', 'Estado actualizado');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status } : null);
      }
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const statusConfig = {
    pendiente: { label: 'Pendiente', icon: <Clock className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
    en_camino: { label: 'En camino', icon: <Truck className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
    entregado: { label: 'Entregado', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Pedidos</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} pedidos</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pendiente', 'en_camino', 'entregado'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'pendiente' ? 'Pendientes' : f === 'en_camino' ? 'En camino' : 'Entregados'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((order) => {
          const status = statusConfig[order.status];
          return (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</p>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.user_name} | {new Date(order.created_at).toLocaleDateString('es-PE')} | Pago: {order.payment_method}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-emerald-600">S/.{Number(order.total).toFixed(2)}</span>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {order.status !== 'entregado' && (
                  <button
                    onClick={() => updateStatus(order.id, order.status === 'pendiente' ? 'en_camino' : 'entregado')}
                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-all"
                  >
                    {order.status === 'pendiente' ? 'Marcar en camino' : 'Marcar entregado'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No hay pedidos</p>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Pedido #{selectedOrder.id.slice(0, 8)}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.user_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.address}</p>
                {selectedOrder.reference && (
                  <p className="text-sm text-gray-500">Ref: {selectedOrder.reference}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Método de pago</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedOrder.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Productos</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                      <span className="text-gray-700 dark:text-gray-300">{item.product_name} x{item.quantity}</span>
                      <span className="font-medium text-gray-900 dark:text-white">S/.{Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between font-bold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-emerald-600">S/.{Number(selectedOrder.total).toFixed(2)}</span>
              </div>
              <div className="flex gap-2 pt-2">
                {selectedOrder.status === 'pendiente' && (
                  <button
                    onClick={() => updateStatus(selectedOrder.id, 'en_camino')}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all"
                  >
                    <Truck className="w-4 h-4" />
                    Marcar en camino
                  </button>
                )}
                {selectedOrder.status === 'en_camino' && (
                  <button
                    onClick={() => updateStatus(selectedOrder.id, 'entregado')}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar entregado
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
