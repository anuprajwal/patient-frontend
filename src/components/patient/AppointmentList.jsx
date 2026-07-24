import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { Calendar, Clock, Tag, FileText, Upload, Trash2, ShieldAlert, Paperclip } from 'lucide-react';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Isolated management focus state parameters
  const [activeAppointmentDocs, setActiveAppointmentDocs] = useState({}); // Stores array collections per appointmentId key mapping
  const [processingDocId, setProcessingDocId] = useState(null);

  const syncAppointmentsList = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await patientEndpoints.listAppointments();
      const list = response.data?.appointments || response.data || [];
      setAppointments(list);

      // Eager load attached documents matrix for every scheduled record index row item
      if (Array.isArray(list)) {
        list.forEach(async (app) => {
          try {
            const docRes = await patientEndpoints.getDocumentsForAppointment(app.id);
            setActiveAppointmentDocs(prev => ({
              ...prev,
              [app.id]: docRes.data?.documents || docRes.data || []
            }));
          } catch (e) { /* Safe silent suppression of individual row ledger check mismatch logs */ }
        });
      }
    } catch (err) {
      setError('Failed to fetch clinical consultation history metrics records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { syncAppointmentsList(); }, []);

  const handleDocumentUpload = async (e, appointmentId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setProcessingDocId(appointmentId);
    const fd = new FormData();
    fd.append('appointment_id', String(appointmentId));
    fd.append('document', file);

    try {
      await patientEndpoints.uploadAppointmentDocument(fd);
      // Re-fetch individual operational document ledger rows
      const docRes = await patientEndpoints.getDocumentsForAppointment(appointmentId);
      setActiveAppointmentDocs(prev => ({ ...prev, [appointmentId]: docRes.data?.documents || docRes.data || [] }));
    } catch (err) {
      alert('File binary streaming rejected by remote healthcare storage nodes.');
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleDocumentDelete = async (documentId, appointmentId) => {
    if (!confirm("Permanently strip this clinical document node attachment?")) return;
    setProcessingDocId(appointmentId);
    try {
      await patientEndpoints.deleteAppointmentDocument(documentId);
      const docRes = await patientEndpoints.getDocumentsForAppointment(appointmentId);
      setActiveAppointmentDocs(prev => ({ ...prev, [appointmentId]: docRes.data?.documents || docRes.data || [] }));
    } catch (err) {
      alert('Purge operation rejected at remote storage clearance point.');
    } finally {
      setProcessingDocId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Clinical Consultation Logs</h2>
        <p className="text-slate-500 text-sm">Monitor history indices, status allocations, and manage attached supporting lab files.</p>
      </div>

      <Alert type="error" message={error} />

      {loading ? <Loader /> : (
        <div className="space-y-6">
          {Array.isArray(appointments) && appointments.map((app) => {
            const currentDocs = activeAppointmentDocs[app.id] || [];
            return (
              <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-base">Consultation with Dr. {app.doctorName || 'Practitioner ID: ' + app.doctor_id}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${app.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-brand-50 border-brand-200 text-brand-700'}`}>
                        {app.status || 'Active Allocation'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {app.date} | {app.start || app.time}</span>
                      <span className="flex items-center gap-1 capitalize"><Tag className="w-3.5 h-3.5" /> {app.type || 'Standard'} Mode</span>
                    </div>
                  </div>
                  
                  {/* Binary Streams Attachment Input Button */}
                  <div>
                    <label className={`flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm select-none ${processingDocId === app.id ? 'opacity-40 pointer-events-none' : ''}`}>
                      <Upload className="w-3.5 h-3.5" /> Attach Lab Report
                      <input type="file" accept=".pdf,.docx,image/*" className="hidden" onChange={(e) => handleDocumentUpload(e, app.id)} />
                    </label>
                  </div>
                </div>

                {/* Grid Framework Listing Operational Row Attachments */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Paperclip className="w-3 h-3" /> Attached Health Diagnostics Data Matrix ({currentDocs.length})
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {currentDocs.map((doc) => (
                      <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 hover:bg-slate-100/60 transition-colors">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <a href={doc.file_url || doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-700 hover:text-brand-600 truncate underline decoration-dotted">
                            {doc.file_name || `DocNode_#${doc.id}`}
                          </a>
                        </div>
                        <button onClick={() => handleDocumentDelete(doc.id, app.id)} className="text-slate-400 hover:text-rose-600 p-1 transition-colors flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    
                    {currentDocs.length === 0 && (
                      <div className="col-span-full p-3 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-slate-400 italic text-[11px] flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> No supporting diagnostics or clinical files mapped to this booking row.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {appointments.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium">
              No historical clinic consultation events discovered inside this user portfolio context.
            </div>
          )}
        </div>
      )}
    </div>
  );
}