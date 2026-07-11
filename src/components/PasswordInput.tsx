'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}

export function PasswordInput({
  id,
  name,
  placeholder = '••••••••',
  required = false,
  autoComplete = 'current-password'
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={isVisible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        className="w-full h-11 px-4 pr-12 rounded-2xl border border-white/40
                   bg-white/90 text-slate-800
                   text-base font-medium
                   focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:ring-offset-0
                   placeholder:text-slate-400
                   transition-all duration-200"
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(!isVisible);
        }}
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 
                   text-violet-600 hover:text-fuchsia-600 
                   transition-colors duration-200 p-2 hover:bg-white/40 rounded-lg"
        title={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}