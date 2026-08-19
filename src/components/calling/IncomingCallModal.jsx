// src/components/calling/IncomingCallModal.jsx
import React from 'react';
import { useCall } from '../../context/CallContext';
import { Phone, PhoneOff, User } from '../ui/Icons';

export default function IncomingCallModal() {
  const { incomingCallData, callState, acceptCall, rejectCall } = useCall();

  if (callState !== 'RINGING_IN' || !incomingCallData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6 relative overflow-hidden">
        {/* Pulsing Ring Animation */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center shadow-inner">
            <User className="w-10 h-10" />
          </div>
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Incoming Consultation Call
          </span>
          <h3 className="text-xl font-black text-slate-800 mt-3 truncate">
            {incomingCallData.call_from_user || 'Healthcare Participant'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Appointment Ref #{incomingCallData.appointment_id}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-6 pt-2">
          {/* Reject */}
          <button
            type="button"
            onClick={rejectCall}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-rose-500 group-hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform transform group-active:scale-95">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Decline</span>
          </button>

          {/* Accept */}
          <button
            type="button"
            onClick={acceptCall}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500 group-hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform transform group-active:scale-95 animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}