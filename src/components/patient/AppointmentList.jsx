import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { 
  Calendar, Clock, Tag, User, Video, MapPin, 
  ChevronRight, CheckCircle2, AlertCircle, ShieldCheck 
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
      // Directly extract the array from response.data.appointments
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

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(app => {
    if (activeFilter === 'all') return true;
    return (app.appointment_status || '').toLowerCase() === activeFilter;
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
    if (s === 'completed') {
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
        <div className="space-y-4">
          {filteredAppointments.map((app) => {
            const doctor = app.doctor || {};
            const profile = doctor.doctorProfile || {};
            const dateStr = app.appointment_date ? new Date(app.appointment_date).toLocaleDateString('en-US', {
              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            }) : 'N/A';

            return (
              <div
                key={app.id}
                onClick={() => onSelectAppointment(app)}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Doctor Profile Picture */}
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