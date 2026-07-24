import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Alert from '../ui/Alert';
import { ShieldAlert, X } from 'lucide-react';

export default function VerificationModal({ target, phoneNumber, onClose, onSuccess }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const triggerOtpRequest = async () => {
      try {
        if (target === 'email') await patientEndpoints.sendEmailOtp();
        else await patientEndpoints.sendMobileOtp();
      } catch (err) {
        setError('Failed to transmit authorization handshake token across server pipelines.');
      }
    };
    triggerOtpRequest();
  }, [target]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await patientEndpoints.verifyOtp({
        userOtp: otp,
        ...(target === 'mobile' && { phoneNumber })
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification matrix match failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-2xl overflow-hidden p-6 space-y-4 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        
        <div className="flex gap-3">
          <div className="p-2 bg-brand-50 text-brand-600 border border-brand-100 rounded-lg h-fit"><ShieldAlert className="w-5 h-5" /></div>
          <div>
            <h4 className="font-bold text-slate-900 text-base capitalize">{target} Authentication Protocol</h4>
            <p className="text-slate-500 text-xs mt-0.5">Enter the 6-digit cryptographic verification key received.</p>
          </div>
        </div>

        <Alert type="error" message={error} />

        <form onSubmit={handleVerify} className="space-y-4 pt-2">
          <input
            type="text"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="000000"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-extrabold tracking-widest text-xl py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Processing Handshake...' : 'Verify Parameters'}
          </button>
        </form>
      </div>
    </div>
  );
}