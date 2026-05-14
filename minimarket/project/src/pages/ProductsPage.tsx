import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import type { Product, CartItem } from '../types';
import { ShoppingCart, Plus, Minus, Search, Filter, Tag } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'cargadores', label: 'Cargadores' },
  { value: 'fundas', label: 'Fundas' },
  { value: 'audifonos', label: 'Audífonos' },
  { value: 'cables', label: 'Cables' },
  { value: 'protectores', label: 'Protectores' },
  { value: 'baterias', label: 'Baterías' },
  { value: 'soportes', label: 'Soportes' },
  { value: 'accesorios', label: 'Accesorios' },
];

const PRODUCT_IMAGES: Record<string, string> = {
  cargadores: 'https://images.pexels.com/photos/4097201/pexels-photo-4097201.jpeg?auto=compress&cs=tinysrgb&w=400',
  fundas: 'https://images.pexels.com/photos/1670768/pexels-photo-1670768.jpeg?auto=compress&cs=tinysrgb&w=400',
  audifonos: 'https://images.pexels.com/photos/3921827/pexels-photo-3921827.jpeg?auto=compress&cs=tinysrgb&w=400',
  cables: 'https://images.pexels.com/photos/4219867/pexels-photo-4219867.jpeg?auto=compress&cs=tinysrgb&w=400',
  protectores: 'https://images.pexels.com/photos/24709142/pexels-photo-24709142.jpeg?auto=compress&cs=tinysrgb&w=400',
  baterias: 'https://images.pexels.com/photos/8137313/pexels-photo-8137313.jpeg?auto=compress&cs=tinysrgb&w=400',
  soportes: 'https://images.pexels.com/photos/7738879/pexels-photo-7738879.jpeg?auto=compress&cs=tinysrgb&w=400',
  accesorios: 'https://images.pexels.com/photos/4219867/pexels-photo-4219867.jpeg?auto=compress&cs=tinysrgb&w=400',
};

export default function ProductsPage() {
  const { user } = useAuth();
  const { addNotification, darkMode, searchQuery, selectedCategory, setSelectedCategory, setPage } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setProducts(data);
    setLoading(false);
  };

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', user.id);
    if (data) setCartItems(data);
  };

  const getCartQuantity = (productId: string) => {
    const item = cartItems.find((c) => c.product_id === productId);
    return item?.quantity || 0;
  };

  const addToCart = async (product: Product) => {
    if (!user) {
      addNotification('info', 'Inicia sesión para agregar productos al carrito');
      setPage('login');
      return;
    }
    const existing = cartItems.find((c) => c.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        addNotification('error', 'No hay más stock disponible');
        return;
      }
      const { data } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id)
        .select('*, product:products(*)')
        .maybeSingle();
      if (data) {
        setCartItems((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      }
    } else {
      const { data } = await supabase
        .from('cart_items')
        .insert({ user_id: user.id, product_id: product.id, quantity: 1 })
        .select('*, product:products(*)')
        .maybeSingle();
      if (data) setCartItems((prev) => [...prev, data]);
    }
    addNotification('success', `${product.name} agregado al carrito`);
  };

  const decreaseCart = async (product: Product) => {
    if (!user) return;
    const existing = cartItems.find((c) => c.product_id === product.id);
    if (!existing) return;
    if (existing.quantity <= 1) {
      await supabase.from('cart_items').delete().eq('id', existing.id);
      setCartItems((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      const { data } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity - 1 })
        .eq('id', existing.id)
        .select('*, product:products(*)')
        .maybeSingle();
      if (data) setCartItems((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const offers = filteredProducts.filter((p) => p.discount_percent > 0);
  const regular = filteredProducts.filter((p) => p.discount_percent === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const ProductCard = ({ product }: { product: Product }) => {
    const qty = getCartQuantity(product.id);
    const discountedPrice = product.discount_percent > 0
      ? product.price * (1 - product.discount_percent / 100)
      : null;
    const img = product.image_url || PRODUCT_IMAGES[product.category] || PRODUCT_IMAGES.accesorios;

    return (
      <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/5 transition-all hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-700">
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.discount_percent > 0 && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
              -{product.discount_percent}%
            </div>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              Últimas {product.stock}
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Agotado</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">{product.category}</p>
          <h3 className="font-semibold text-gray-900 dark:text-white mt-1 text-sm line-clamp-1">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
          )}
          <div className="flex items-end gap-2 mt-2">
            {discountedPrice ? (
              <>
                <span className="text-lg font-bold text-emerald-600">S/.{discountedPrice.toFixed(2)}</span>
                <span className="text-sm text-gray-400 line-through">S/.{product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-lg font-bold text-emerald-600">S/.{product.price.toFixed(2)}</span>
            )}
          </div>
          {product.stock > 0 ? (
            qty > 0 ? (
              <div className="flex items-center justify-between mt-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-1">
                <button
                  onClick={() => decreaseCart(product)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:bg-red-50 transition-colors"
                >
                  <Minus className="w-4 h-4 text-red-500" />
                </button>
                <span className="font-bold text-emerald-600 text-sm">{qty}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:bg-emerald-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-emerald-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(product)}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
              >
                <ShoppingCart className="w-4 h-4" />
                Agregar
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full mt-3 bg-gray-200 dark:bg-gray-700 text-gray-500 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed"
            >
              Agotado
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">{filteredProducts.length} productos disponibles</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setSelectedCategory(c.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === c.value
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Offers section */}
      {offers.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ofertas especiales</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {offers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* All products */}
      <div>
        {offers.length > 0 && (
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Todos los productos</h2>
        )}
        {regular.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {regular.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
