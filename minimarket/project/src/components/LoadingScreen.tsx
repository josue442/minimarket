export default function LoadingScreen({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-200" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
      </div>
      <p className="text-gray-500 text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
}
