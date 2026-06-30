'use client';

import { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';

interface SafeDeleteButtonProps {
  itemName: string;
  onConfirmDelete: () => Promise<void>;
  variant?: 'sm' | 'md';
}

export function SafeDeleteButton({ 
  itemName, 
  onConfirmDelete,
  variant = 'md'
}: SafeDeleteButtonProps) {
  const [stage, setStage] = useState<'idle' | 'confirm'>('idle');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const confirmText = `deletar ${itemName}`;

  const handleDelete = async () => {
    if (inputValue.toLowerCase() !== confirmText.toLowerCase()) return;
    
    setLoading(true);
    try {
      await onConfirmDelete();
      setStage('idle');
      setInputValue('');
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
    setLoading(false);
  };

  if (stage === 'idle') {
    return (
      <button
        onClick={() => setStage('confirm')}
        className={`flex items-center gap-2 font-bold rounded-2xl transition-all bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border border-red-500/30 ${variant === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base'}`}
      >
        <Trash2 size={18} />
        Deletar
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50/80 to-rose-50/80 border border-red-200/60 rounded-2xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="bg-red-600 rounded-full p-2 flex-shrink-0">
          <AlertCircle className="text-white" size={18} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-red-900">⚠️ Ação Irreversível!</h4>
          <p className="text-xs text-red-800 mt-1">Digite o texto abaixo:</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-100 to-rose-100 border border-red-300/60 rounded-xl px-3 py-2 text-center">
        <code className="text-red-900 font-bold text-sm">{confirmText}</code>
      </div>

      <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={`Digite: ${confirmText}`} autoFocus className="w-full h-10 px-3 rounded-xl border border-red-300/60 bg-white/90 text-red-900 font-medium text-sm placeholder:text-red-600/50 focus:outline-none focus:ring-2 focus:ring-red-600" />

      <div className="flex gap-2 justify-end">
        <button onClick={() => { setStage('idle'); setInputValue(''); }} className="px-3 py-1.5 rounded-xl font-bold bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm">Cancelar</button>
        <button onClick={handleDelete} disabled={inputValue.toLowerCase() !== confirmText.toLowerCase() || loading} className="px-3 py-1.5 rounded-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-400 text-white text-sm disabled:cursor-not-allowed">
          {loading ? 'Deletando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}