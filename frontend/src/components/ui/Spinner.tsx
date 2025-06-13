import { Loader } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader className='animate-spin h-8 w-8 text-blue-400' />
    </div>
  );
}
