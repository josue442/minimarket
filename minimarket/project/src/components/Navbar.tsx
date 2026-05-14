import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import {
  ShoppingCart,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Package,
  LayoutDashboard,
  History,
  Home,
  Search,
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { page, setPage, darkMode, toggleDarkMode, searchQuery, setSearchQuery } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    await signOut();
    setPage('home');
  };

  const navItems = user
    ? isAdmin
      ? [
          { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, page: 'admin-dashboard' as const },
          { label: 'Productos', icon: <Package className="w-4 h-4" />, page: 'admin-products' as const },
          { label: 'Pedidos', icon: <History className="w-4 h-4" />, page: 'admin-orders' as const },
        ]
      : [
          { label: 'Inicio', icon: <Home className="w-4 h-4" />, page: 'home' as const },
          { label: 'Productos', icon: <Package className="w-4 h-4" />, page: 'products' as const },
          { label: 'Carrito', icon: <ShoppingCart className="w-4 h-4" />, page: 'cart' as const },
          { label: 'Mis Pedidos', icon: <History className="w-4 h-4" />, page: 'orders' as const },
        ]
    : [
        { label: 'Inicio', icon: <Home className="w-4 h-4" />, page: 'home' as const },
        { label: 'Productos', icon: <Package className="w-4 h-4" />, page: 'products' as const },
      ];

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-900/90 border-gray-700'
          : 'bg-white/90 border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => setPage('home')}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span
              className={`text-xl font-bold tracking-tight ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Nova<span className="text-emerald-500">Market</span>
            </span>
          </button>

          {/* Search bar - desktop */}
          {!isAdmin && (
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div
                className={`flex items-center gap-2 w-full rounded-xl px-4 py-2 transition-colors ${
                  darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Search className="w-4 h-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-sm"
                />
              </div>
            </div>
          )}

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  page === item.page
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <div className="flex items-center gap-2">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {profile?.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPage('login')}
                className="ml-2 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
              >
                <User className="w-4 h-4" />
                Ingresar
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-t animate-slide-down ${
            darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
          }`}
        >
          <div className="px-4 py-3 space-y-1">
            {!isAdmin && (
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-3 ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}
              >
                <Search className="w-4 h-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent outline-none flex-1 text-sm ${
                    darkMode ? 'text-gray-200' : 'text-gray-600'
                  }`}
                />
              </div>
            )}
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  setPage(item.page);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  page === item.page
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                toggleDarkMode();
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium ${
                darkMode ? 'text-yellow-400' : 'text-gray-600'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {darkMode ? 'Modo claro' : 'Modo oscuro'}
            </button>
            {user ? (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {profile?.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setPage('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                Ingresar
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
