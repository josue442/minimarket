import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import type { CartItem } from '../types';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { user, profile } = useAuth();
  const { setPage, addNotification } = useApp();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', user.id);
    if (data) setCartItems(data);
    setLoading(false);
  };

  const updateQuantity = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      await removeItem(item);
      return;
    }
    if (item.product && newQty > item.product.stock) {
      addNotification('error', 'No hay más stock disponible');
      return;
    }
    const { data } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', item.id)
      .select('*, product:products(*)')
      .maybeSingle();
    if (data) setCartItems((prev) => prev.map((c) => (c.id === data.id ? data : c)));
  };

  const removeItem = async (item: CartItem) => {
    await supabase.from('cart_items').delete().eq('id', item.id);
    setCartItems((prev) => prev.filter((c) => c.id !== item.id));
    addNotification('info', 'Producto eliminado del carrito');
  };

  const getItemPrice = (item: CartItem) => {
    if (!item.product) return 0;
    const discount = item.product.discount_percent || 0;
    const userDiscount = profile?.has_discount ? 15 : 0;
    const totalDiscount = discount + userDiscount * (1 - discount / 100);
    return item.product.price * (1 - totalDiscount / 100);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const totalDiscount = cartItems.reduce((sum, item) => {
    if (!item.product) return sum;
    const original = item.product.price * item.quantity;
    return sum + (original - getItemPrice(item) * item.quantity);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tu carrito está vacío</h2>
        <p className="text-gray-500 text-sm">Agrega productos para empezar a comprar</p>
        <button
          onClick={() => setPage('products')}
          className="mt-2 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
        >
          Ver productos
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mi Carrito</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex gap-4"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {item.product?.image_url ? (
                  <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.product?.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.product?.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-emerald-600 font-bold text-sm">S/.{getItemPrice(item).toFixed(2)}</span>
                  {(item.product?.discount_percent || 0) > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      S/.{item.product?.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(item, -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-600 shadow-sm"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-6 text-center dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-600 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 h-fit sticky top-24">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Resumen</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>S/.{(subtotal + totalDiscount).toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuento</span>
                <span>-S/.{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            {profile?.has_discount && (
              <div className="flex justify-between text-amber-600 text-xs">
                <span>Incluye 15% nueva cuenta</span>
              </div>
            )}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span className="text-emerald-600 text-lg">S/.{subtotal.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => setPage('checkout')}
            className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            Proceder al pago
          </button>
        </div>
      </div>
    </div>
  );
}
