// src/components/patient/appointment-details/DoctorSummaryCard.jsx

import React from 'react';
import { User, ShieldCheck, Mail, Phone, IndianRupee, MapPin, CalendarPlus, Video } from 'lucide-react';
// HERE THERE IS A CHANGE MADE: Import useCall from CallContext
import { useCall } from '../../../context/CallContext';

export default function DoctorSummaryCard({ 
  doctor, 
  profile, 
  appointment, 
  isAppointmentClosed, 
  onOpenCheckupModal, 
  onFetchAddress, 
  fetchingAddress 
}) {
  // HERE THERE IS A CHANGE MADE: Consume WebRTC calling engine
  const { initiateCall, callState } = useCall();
  const appType = (appointment?.appointment_type || '').toLowerCase();
  const isOnline = appType.includes('online');
  const isOffline = appType.includes('offline');
  const isHybrid = appType.includes('hybrid');

  const handleStartCall = () => {
    if (appointment?.id) {
      initiateCall(appointment.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Doctor Demographic & Fee Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
        {profile?.profile_picture ? (
          <img 
            src={profile.profile_picture} 
            alt={doctor?.username || 'Doctor'} 
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-slate-100 shadow-sm" 
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto border border-slate-100">
            <User className="w-10 h-10" />
          </div>
        )}

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center justify-center gap-1">
            {doctor?.username || 'Dr. Practitioner'} 
            {profile?.verified_status && <ShieldCheck className="w-4 h-4 text-blue-500" />}
          </h3>
          <p className="text-blue-600 font-bold text-xs mt-0.5">{profile?.specialization || 'Specialist'}</p>
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5 text-xs font-semibold text-slate-600 text-left">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" /> 
            <span className="truncate">{doctor?.email || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" /> 
            <span>{doctor?.phone_number || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3">
            <IndianRupee className="w-4 h-4 text-slate-400 flex-shrink-0" /> 
            <span className="text-slate-900 font-bold">₹{profile?.consultation_fee || '0'} Base Fee</span>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
          Consultation Actions
        </span>
        
        {/* Follow-up Checkup Trigger */}
        {isAppointmentClosed && (
          <button
            type="button"
            onClick={onOpenCheckupModal}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <CalendarPlus className="w-4 h-4" /> Book Checkup Appointment
          </button>
        )}

        {/* Online Call Button */}
        {isOnline && (
          <button
            type="button"
            onClick={handleStartCall}
            disabled={callState !== 'IDLE'}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Video className="w-4 h-4" /> {callState !== 'IDLE' ? 'Calling...' : 'Call Doctor'}
          </button>
        )}

        {/* Offline Clinic Address Button */}
        {isOffline && (
          <button
            type="button"
            disabled={fetchingAddress}
            onClick={onFetchAddress}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-colors border border-slate-200"
          >
            <MapPin className="w-4 h-4 text-rose-500" /> {fetchingAddress ? 'Fetching Clinic Address...' : 'Get Clinic Address'}
          </button>
        )}

        {/* Hybrid Actions */}
        {isHybrid && (
          <div className="space-y-2">
            <button
              type="button"
              disabled={fetchingAddress}
              onClick={onFetchAddress}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-colors border border-slate-200"
            >
              <MapPin className="w-4 h-4 text-rose-500" /> {fetchingAddress ? 'Fetching...' : 'Get Clinic Address'}
            </button>
            <button
              type="button"
              onClick={handleStartCall}
              disabled={callState !== 'IDLE'}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Video className="w-4 h-4" /> {callState !== 'IDLE' ? 'Calling...' : 'Call Doctor'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}