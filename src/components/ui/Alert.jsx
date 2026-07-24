import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function Alert({ type = 'error', message }) {
  if (!message) return null;
  return (
    <div className={`p-4 rounded-lg flex items-start gap-3 my-4 border ${
      type === 'success' 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
        : 'bg-rose-50 border-rose-200 text-rose-800'
    }`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}