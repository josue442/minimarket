import { useApp } from '../contexts/AppContext';
import { X, CheckCircle, AlertCircle, Info, Tag } from 'lucide-react';

export default function Notifications() {
  const { notifications, removeNotification } = useApp();

  if (notifications.length === 0) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    discount: <Tag className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    discount: 'bg-amber-500 text-white',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`${colors[n.type]} rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 animate-slide-in`}
        >
          {icons[n.type]}
          <span className="flex-1 text-sm font-medium">{n.message}</span>
          <button onClick={() => removeNotification(n.id)} className="hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
