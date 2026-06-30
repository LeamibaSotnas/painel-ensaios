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
        className="w-full h-11 px-4 pr-12 rounded-2xl border border-white/60 
                   bg-white/80 backdrop-blur-sm
                   text-base font-medium
                   focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2
                   placeholder:text-muted-foreground
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