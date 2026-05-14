import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import type { Product, CartItem } from '../types';
import {
  ShoppingCart,
  Tag,
  Truck,
  Shield,
  Star,
  Plus,
  Minus,
  Search,
  ArrowRight,
  Clock,
  Percent,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Todos', icon: '🛒' },
  { value: 'cargadores', label: 'Cargadores', icon: '🔌' },
  { value: 'fundas', label: 'Fundas', icon: '📱' },
  { value: 'audifonos', label: 'Audífonos', icon: '🎧' },
  { value: 'cables', label: 'Cables', icon: '🔗' },
  { value: 'protectores', label: 'Protectores', icon: '🛡️' },
  { value: 'baterias', label: 'Baterías', icon: '🔋' },
  { value: 'soportes', label: 'Soportes', icon: '📐' },
  { value: 'accesorios', label: 'Accesorios', icon: '⚙️' },
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

export default function HomePage() {
  const { user } = useAuth();
  const { setPage, addNotification, darkMode, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useApp();
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
      if (data) setCartItems((prev) => prev.map((c) => (c.id === data.id ? data : c)));
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
  const noOffers = filteredProducts.filter((p) => p.discount_percent === 0);

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const ProductCard = ({ product }: { product: Product }) => {
    const qty = getCartQuantity(product.id);
    const discountedPrice = product.discount_percent > 0
      ? product.price * (1 - product.discount_percent / 100)
      : null;
    const img = product.image_url || PRODUCT_IMAGES[product.category] || PRODUCT_IMAGES.general;

    return (
      <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/5 transition-all hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-700">
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.discount_percent > 0 && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
              <Percent className="w-3 h-3" />
              {product.discount_percent}%
            </div>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              Últimas {product.stock}
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-red-600 px-4 py-2 rounded-xl">Agotado</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">{product.category}</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Banner - compact minimarket style */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-white font-medium mb-4 animate-bounce-slow">
                <Tag className="w-4 h-4" />
                15% de descuento en tu primera compra
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Accesorios para
                <br />
                <span className="text-yellow-300">tu celular</span>
              </h1>
              <p className="mt-3 text-base text-emerald-100 max-w-lg mx-auto md:mx-0">
                Cargadores, fundas, audífonos, cables y más. Todo para tu celular con entrega rápida.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start text-white/80 text-sm">
                <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Envío rápido</span>
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Pago seguro</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Abierto 24/7</span>
              </div>
            </div>
            {/* Search bar in hero */}
            <div className="flex-1 w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-semibold mb-3 text-sm">Buscar productos</h3>
                <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="¿Qué necesitas hoy?"
                    className="bg-transparent outline-none flex-1 text-sm text-gray-700"
                  />
                </div>
                {user && totalCartItems > 0 && (
                  <button
                    onClick={() => setPage('cart')}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-2.5 rounded-xl font-bold text-sm transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Ver carrito ({totalCartItems})
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === c.value
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : darkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Offers section */}
        {offers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ofertas del día</h2>
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-lg">
                {offers.length} productos
              </span>
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
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedCategory === 'all' ? 'Todos los productos' : CATEGORIES.find(c => c.value === selectedCategory)?.label}
            </h2>
            <span className="text-gray-400 text-sm">
              {noOffers.length} productos
            </span>
          </div>
          {noOffers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {noOffers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No se encontraron productos</p>
              <p className="text-gray-400 text-sm mt-1">Intenta con otra búsqueda o categoría</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom CTA */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-2xl font-bold text-white">Regístrate y obtén 15% de descuento</h2>
              <p className="text-emerald-100 mt-2 max-w-md mx-auto text-sm">
                Crea tu cuenta en segundos y disfruta de ofertas exclusivas en todos los productos.
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => setPage('register')}
                  className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-xl"
                >
                  Crear cuenta gratis
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage('login')}
                  className="inline-flex items-center gap-2 bg-emerald-700/50 backdrop-blur-sm text-white border border-white/20 px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700/70 transition-all"
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
