// src/components/patient/AppointmentList.jsx

import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { 
  Calendar, Clock, User, Video, MapPin, 
  ChevronRight, CheckCircle2, AlertCircle, ShieldCheck, GitBranch, CalendarPlus 
} from 'lucide-react';

export default function AppointmentList({ onSelectAppointment }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'confirmed' | 'completed'

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await patientEndpoints.listAppointments();
      const list = response.data?.appointments || [];
      setAppointments(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(app => {
    if (activeFilter === 'all') return true;
    const status = (app.appointment_status || '').toLowerCase();
    if (activeFilter === 'completed') return status === 'closed' || status === 'completed';
    return status === activeFilter;
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
        </span>
      );
    }
    if (s === 'closed' || s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertCircle className="w-3.5 h-3.5" /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Consultations</h2>
          <p className="text-slate-500 text-sm mt-0.5">Track and manage all your scheduled healthcare appointments.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
          {['all', 'pending', 'confirmed', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeFilter === tab 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <Alert type="error" message={error} />

      {loading ? <Loader /> : (
        <div className="space-y-5">
          {filteredAppointments.map((app) => {
            const doctor = app.doctor || {};
            const profile = doctor.doctorProfile || {};
            const checkups = Array.isArray(app.checkupAppointment) ? app.checkupAppointment : [];
            const dateStr = app.appointment_date ? new Date(app.appointment_date).toLocaleDateString('en-US', {
              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            }) : 'N/A';

            return (
              <div key={app.id} className="relative">
                {/* Main Root Appointment Node */}
                <div
                  onClick={() => onSelectAppointment(app)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10"
                >
                  <div className="flex items-start gap-4">
                    {profile.profile_picture ? (
                      <img 
                        src={profile.profile_picture} 
                        alt={doctor.username} 
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm flex-shrink-0" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <User className="w-7 h-7" />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          #{app.id} Primary
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-base group-hover:text-brand-600 transition-colors">
                          {doctor.username || 'Practitioner'}
                        </h3>
                        {profile.verified_status && (
                          <ShieldCheck className="w-4 h-4 text-brand-500" />
                        )}
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {profile.specialization || 'General'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {app.appointment_start_time?.substring(0, 5)} - {app.appointment_end_time?.substring(0, 5)}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          {app.appointment_type === 'online_video' ? (
                            <Video className="w-3.5 h-3.5 text-brand-500" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          )} 
                          {app.appointment_type?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {getStatusBadge(app.appointment_status)}
                    <div className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                      View Details <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Tree Structure Branches for Checkup Appointments */}
                {checkups.length > 0 && (
                  <div className="ml-6 sm:ml-10 relative mt-2 space-y-2">
                    {/* Vertical Connecting Trunk */}
                    <div className="absolute -top-3 bottom-5 left-0 w-0.5 bg-emerald-300 border-l border-dashed border-emerald-400" />

                    {checkups.map((checkup, cIdx) => {
                      const checkupDateStr = checkup.checkup_date ? new Date(checkup.checkup_date).toLocaleDateString('en-US', {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                      }) : 'N/A';

                      return (
                        <div key={checkup.id || cIdx} className="relative flex items-center">
                          {/* Horizontal Tree Branch Line */}
                          <div className="w-6 sm:w-8 h-0.5 border-b-2 border-dashed border-emerald-400" />

                          {/* Checkup Appointment Leaf Card */}
                          <div 
                            onClick={() => onSelectAppointment(app)}
                            className="flex-1 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                <GitBranch className="w-4 h-4" />
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded">
                                    Checkup #{checkup.id}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">
                                    Follow-up Consultation
                                  </span>
                                  {checkup.is_payment_required === false && (
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                                      FREE
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-600 font-medium">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {checkupDateStr}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> {checkup.checkup_start_time?.substring(0, 5)} - {checkup.checkup_end_time?.substring(0, 5)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2">
                              {getStatusBadge(checkup.checkup_status)}
                              <span className="text-xs font-bold text-emerald-700 flex items-center">
                                Review <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {!loading && filteredAppointments.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              No appointments found matching your filter options.
            </div>
          )}
        </div>
      )}
    </div>
  );
}