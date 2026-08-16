// src/components/patient/appointment-details/DoctorSummaryCard.jsx

import React from 'react';
import { User, ShieldCheck, Mail, Phone, IndianRupee, MapPin, CalendarPlus } from 'lucide-react';
import { handleCallDoctor } from '../../../utils/appointmentActions';

export default function DoctorSummaryCard({ 
  doctor, 
  profile, 
  appointment, 
  isAppointmentClosed, 
  onOpenCheckupModal, 
  onFetchAddress, 
  fetchingAddress 
}) {
  const appType = (appointment?.appointment_type || '').toLowerCase();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
        {profile.profile_picture ? (
          <img 
            src={profile.profile_picture} 
            alt={doctor.username} 
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-slate-100 shadow-sm" 
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto">
            <User className="w-10 h-10" />
          </div>
        )}

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center justify-center gap-1">
            {doctor.username || 'Dr. Practitioner'} 
            {profile.verified_status && <ShieldCheck className="w-4 h-4 text-brand-500" />}
          </h3>
          <p className="text-brand-600 font-bold text-xs mt-0.5">{profile.specialization || 'Specialist'}</p>
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5 text-xs font-semibold text-slate-600 text-left">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400" /> <span className="truncate">{doctor.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-400" /> <span>{doctor.phone_number}</span>
          </div>
          <div className="flex items-center gap-3">
            <IndianRupee className="w-4 h-4 text-slate-400" /> <span className="text-slate-900 font-bold">₹{profile.consultation_fee} Base Fee</span>
          </div>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Quick Actions</span>
        
        {isAppointmentClosed && (
          <button
            onClick={onOpenCheckupModal}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <CalendarPlus className="w-4 h-4" /> Book Checkup Appointment
          </button>
        )}

        {(appType === 'online_video' || appType === 'online') && (
          <button
            onClick={() => handleCallDoctor(appointment)}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Phone className="w-4 h-4" /> Call Doctor
          </button>
        )}

        {(appType === 'offline_walkin' || appType === 'offline') && (
          <button
            disabled={fetchingAddress}
            onClick={onFetchAddress}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-colors border border-slate-200"
          >
            <MapPin className="w-4 h-4 text-rose-500" /> {fetchingAddress ? 'Fetching Address...' : 'Get Clinic Address'}
          </button>
        )}

        {appType === 'hybrid' && (
          <div className="space-y-2">
            <button
              disabled={fetchingAddress}
              onClick={onFetchAddress}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-colors border border-slate-200"
            >
              <MapPin className="w-4 h-4 text-rose-500" /> {fetchingAddress ? 'Fetching...' : 'Get Address'}
            </button>
            <button
              onClick={() => handleCallDoctor(appointment)}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Phone className="w-4 h-4" /> Call Doctor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}