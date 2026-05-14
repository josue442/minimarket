import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import type { CartItem } from '../types';
import { MapPin, Phone, CreditCard, CheckCircle, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const { user, profile } = useAuth();
  const { setPage, addNotification } = useApp();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [address, setAddress] = useState(profile?.address || '');
  const [reference, setReference] = useState(profile?.reference || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'tarjeta' | 'efectivo'>('yape');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) fetchCart();
  }, [user, profile]);

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', user.id);
    if (data) setCartItems(data);
    setLoading(false);
  };

  const getItemPrice = (item: CartItem) => {
    if (!item.product) return 0;
    const discount = item.product.discount_percent || 0;
    const userDiscount = profile?.has_discount ? 15 : 0;
    const totalDiscount = discount + userDiscount * (1 - discount / 100);
    return item.product.price * (1 - totalDiscount / 100);
  };

  const total = cartItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!address.trim()) newErrors.address = 'La dirección es obligatoria';
    if (!phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setProcessing(true);

    // Simulate 5 second loading
    await new Promise((r) => setTimeout(r, 5000));

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total,
        address,
        reference,
        phone,
        payment_method: paymentMethod,
        status: 'pendiente',
      })
      .select()
      .maybeSingle();

    if (orderError || !order) {
      setProcessing(false);
      addNotification('error', 'Error al procesar la compra');
      return;
    }

    // Create order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product?.name || '',
      quantity: item.quantity,
      unit_price: item.product?.price || 0,
      discount_percent: item.product?.discount_percent || 0,
      subtotal: getItemPrice(item) * item.quantity,
    }));

    await supabase.from('order_items').insert(orderItems);

    // Update stock
    for (const item of cartItems) {
      if (item.product) {
        await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product_id);
      }
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq('user_id', user.id);

    // Update profile address
    await supabase
      .from('profiles')
      .update({ address, reference, phone })
      .eq('id', user.id);

    setProcessing(false);
    setSuccess(true);
    addNotification('success', 'Compra realizada con éxito.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center animate-bounce-slow">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compra realizada con éxito</h2>
        <p className="text-gray-500 text-sm text-center max-w-md">
          Tu pedido ha sido procesado correctamente. Recibirás actualizaciones del estado de tu entrega.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setPage('orders')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
          >
            Ver mis pedidos
          </button>
          <button
            onClick={() => setPage('products')}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-emerald-200" />
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Procesando tu compra</h2>
          <p className="text-gray-500 text-sm mt-1">Esto tomará unos segundos...</p>
        </div>
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-progress" />
        </div>
      </div>
    );
  }

  const paymentMethods = [
    { value: 'yape' as const, label: 'Yape', color: 'bg-purple-500', icon: '📱' },
    { value: 'plin' as const, label: 'Plin', color: 'bg-green-500', icon: '💚' },
    { value: 'tarjeta' as const, label: 'Tarjeta', color: 'bg-blue-500', icon: '💳' },
    { value: 'efectivo' as const, label: 'Efectivo', color: 'bg-amber-500', icon: '💵' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Finalizar Compra</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Dirección de entrega
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); if (errors.address) setErrors((p) => ({ ...p, address: '' })); }}
                placeholder="Av. Principal 123"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none text-sm ${
                  errors.address ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                } dark:text-white`}
              />
              {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Referencia</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Cerca al parque..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 outline-none text-sm dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: '' })); }}
                  placeholder="999 999 999"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all outline-none text-sm ${
                    errors.phone ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                  } dark:text-white`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            Método de pago
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {paymentMethods.map((pm) => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPaymentMethod(pm.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === pm.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{pm.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Resumen del pedido</h2>
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {item.product?.name} x{item.quantity}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  S/.{(getItemPrice(item) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 mt-4 pt-4 flex justify-between font-bold text-gray-900 dark:text-white">
            <span>Total</span>
            <span className="text-emerald-600 text-lg">S/.{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 rounded-xl font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40"
        >
          Pagar S/.{total.toFixed(2)}
        </button>
      </form>
    </div>
  );
}
