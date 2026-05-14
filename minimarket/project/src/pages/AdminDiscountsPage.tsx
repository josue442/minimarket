import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import type { Discount } from '../types';
import { Plus, X, Save, Tag } from 'lucide-react';

export default function AdminDiscountsPage() {
  const { addNotification } = useApp();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', percent: '', expires_at: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    const { data } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
    if (data) setDiscounts(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.code || !form.percent) {
      addNotification('error', 'Código y porcentaje son obligatorios');
      return;
    }
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase(),
      description: form.description,
      percent: parseFloat(form.percent),
      is_active: true,
      expires_at: form.expires_at || null,
    };

    const { error } = await supabase.from('discounts').insert(payload);
    if (error) {
      addNotification('error', 'Error al crear descuento');
    } else {
      addNotification('success', 'Descuento creado');
      setShowModal(false);
      fetchDiscounts();
    }
    setSaving(false);
  };

  const toggleActive = async (discount: Discount) => {
    const { error } = await supabase
      .from('discounts')
      .update({ is_active: !discount.is_active })
      .eq('id', discount.id);
    if (error) {
      addNotification('error', 'Error al actualizar');
    } else {
      addNotification('success', discount.is_active ? 'Descuento desactivado' : 'Descuento activado');
      fetchDiscounts();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Descuentos</h1>
          <p className="text-gray-500 text-sm mt-1">{discounts.length} descuentos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo descuento
        </button>
      </div>

      <div className="space-y-3">
        {discounts.map((discount) => (
          <div key={discount.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">{discount.code}</span>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold">
                    -{discount.percent}%
                  </span>
                  {!discount.is_active && (
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-xs font-bold">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{discount.description || 'Sin descripción'}</p>
                {discount.expires_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Expira: {new Date(discount.expires_at).toLocaleDateString('es-PE')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => toggleActive(discount)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                discount.is_active
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
              }`}
            >
              {discount.is_active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
        {discounts.length === 0 && (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay descuentos</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nuevo Descuento</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Código</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="NOVA15"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 outline-none text-sm dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Descuento de bienvenida"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 outline-none text-sm dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Porcentaje (%)</label>
                <input
                  type="number"
                  value={form.percent}
                  onChange={(e) => setForm((p) => ({ ...p, percent: e.target.value }))}
                  placeholder="15"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 outline-none text-sm dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha de expiración</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 outline-none text-sm dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
