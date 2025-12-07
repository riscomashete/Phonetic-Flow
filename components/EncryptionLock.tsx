import React, { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';

interface Props {
  isSecure: boolean;
}

export const EncryptionLock: React.FC<Props> = ({ isSecure }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 1000);
    return () => clearTimeout(timer);
  }, [isSecure]);

  return (
    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors duration-500 ${
      isSecure ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
    }`}>
      {isSecure ? (
        <Lock className={`w-3 h-3 ${animate ? 'scale-125' : 'scale-100'} transition-transform duration-300`} />
      ) : (
        <Unlock className="w-3 h-3" />
      )}
      <span>{isSecure ? 'End-to-End Encrypted' : 'Securing Channel...'}</span>
    </div>
  );
};