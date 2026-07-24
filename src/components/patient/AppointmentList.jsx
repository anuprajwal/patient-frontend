import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { Calendar, User, Clock, ShieldCheck, Tag } from 'lucide-react';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await patientEndpoints.listAppointments();
        setAppointments(response.data?.appointments || response.data || []);
      } catch (err) {
        setError('Failed to fetch scheduled clinical appointment list matrix nodes.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Clinical Consultation Logs</h2>
        <p className="text-slate-500 text-sm">Monitor historical records, diagnostic status changes, and pending timelines.</p>
      </div>

      <Alert type="error" message={error} />

      {loading ? <Loader /> : (
        <div className="space-y-4">
          {Array.isArray(appointments) && appointments.map((app) => (
            <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="p-3 bg-brand-50 border border-brand-100 text-brand-600 rounded-xl h-fit hidden sm:block">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">Appointment with Dr. {app.doctorName || 'Practitioner'}</h4>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${
                      app.status === 'completed' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {app.status || 'Pending Verification'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {app.date} at {app.time}</div>
                    <div className="flex items-center gap-1.5 capitalize"><Tag className="w-4 h-4 text-slate-400" /> Mode: {app.mode || 'Online'}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(!appointments || appointments.length === 0) && !loading && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              No clinical appointments recorded inside your user matrix history.
            </div>
          )}
        </div>
      )}
    </div>
  );
}