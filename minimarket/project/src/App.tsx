import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import Navbar from './components/Navbar';
import Notifications from './components/Notifications';
import LoadingScreen from './components/LoadingScreen';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminDiscountsPage from './pages/AdminDiscountsPage';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
} from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { page, setPage, darkMode } = useApp();

  useEffect(() => {
    if (profile?.role === 'admin' && page === 'home') {
      setPage('admin-dashboard');
    }
  }, [profile]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (loading) return <LoadingScreen message="Cargando NovaMarket..." />;

  const isAdmin = profile?.role === 'admin';
  const adminPages = ['admin-dashboard', 'admin-products', 'admin-orders', 'admin-discounts'];
  const isAdminPage = adminPages.includes(page);

  // Redirect unauthenticated users trying to access protected pages
  if (!user && !['home', 'products', 'login', 'register'].includes(page)) {
    setPage('login');
    return null;
  }

  // Redirect non-admin users trying to access admin pages
  if (isAdminPage && !isAdmin) {
    setPage('home');
    return null;
  }

  const renderPage = () => {
    switch (page) {
      case 'login': return <LoginPage />;
      case 'register': return <RegisterPage />;
      case 'home': return <HomePage />;
      case 'products': return <ProductsPage />;
      case 'cart': return <CartPage />;
      case 'checkout': return <CheckoutPage />;
      case 'orders': return <OrdersPage />;
      case 'admin-dashboard': return <AdminDashboard />;
      case 'admin-products': return <AdminProductsPage />;
      case 'admin-orders': return <AdminOrdersPage />;
      case 'admin-discounts': return <AdminDiscountsPage />;
      default: return <HomePage />;
    }
  };

  const adminSidebarItems = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, page: 'admin-dashboard' as const },
    { label: 'Productos', icon: <Package className="w-5 h-5" />, page: 'admin-products' as const },
    { label: 'Pedidos', icon: <ShoppingCart className="w-5 h-5" />, page: 'admin-orders' as const },
    { label: 'Descuentos', icon: <Tag className="w-5 h-5" />, page: 'admin-discounts' as const },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Navbar />
      <Notifications />

      {isAdmin && isAdminPage ? (
        <div className="flex">
          {/* Admin sidebar - desktop */}
          <aside className={`hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] border-r sticky top-16 p-4 gap-1 ${
            darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            {adminSidebarItems.map((item) => (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  page === item.page
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : darkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </aside>

          {/* Admin sidebar - mobile */}
          <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex justify-around py-2">
              {adminSidebarItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => setPage(item.page)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    page === item.page
                      ? 'text-emerald-600'
                      : darkMode
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <main className="flex-1 pb-20 lg:pb-0">
            {renderPage()}
          </main>
        </div>
      ) : (
        <main>
          {renderPage()}
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppProvider>
  );
}
