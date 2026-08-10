// import React, { useState, useEffect } from 'react';
// import { patientEndpoints } from '../../services/api';
// import Loader from '../ui/Loader';
// import Alert from '../ui/Alert';
// import { Calendar, Clock, Tag, FileText, Upload, Trash2, ShieldAlert, Paperclip } from 'lucide-react';

// export default function AppointmentList() {
//   const [appointments, setAppointments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   // Isolated management focus state parameters
//   const [activeAppointmentDocs, setActiveAppointmentDocs] = useState({}); // Stores array collections per appointmentId key mapping
//   const [processingDocId, setProcessingDocId] = useState(null);

//   const syncAppointmentsList = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const response = await patientEndpoints.listAppointments();
//       const list = response.data?.appointments || response.data || [];
//       setAppointments(list);

//       // Eager load attached documents matrix for every scheduled record index row item
//       if (Array.isArray(list)) {
//         list.forEach(async (app) => {
//           try {
//             const docRes = await patientEndpoints.getDocumentsForAppointment(app.id);
//             setActiveAppointmentDocs(prev => ({
//               ...prev,
//               [app.id]: docRes.data?.documents || docRes.data || []
//             }));
//           } catch (e) { /* Safe silent suppression of individual row ledger check mismatch logs */ }
//         });
//       }
//     } catch (err) {
//       setError('Failed to fetch clinical consultation history metrics records.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { syncAppointmentsList(); }, []);

//   const handleDocumentUpload = async (e, appointmentId) => {
//     const file = e.target.files[0];
//     if (!file) return;
    
//     setProcessingDocId(appointmentId);
//     const fd = new FormData();
//     fd.append('appointment_id', String(appointmentId));
//     fd.append('document', file);

//     try {
//       await patientEndpoints.uploadAppointmentDocument(fd);
//       // Re-fetch individual operational document ledger rows
//       const docRes = await patientEndpoints.getDocumentsForAppointment(appointmentId);
//       setActiveAppointmentDocs(prev => ({ ...prev, [appointmentId]: docRes.data?.documents || docRes.data || [] }));
//     } catch (err) {
//       alert('File binary streaming rejected by remote healthcare storage nodes.');
//     } finally {
//       setProcessingDocId(null);
//     }
//   };

//   const handleDocumentDelete = async (documentId, appointmentId) => {
//     if (!confirm("Permanently strip this clinical document node attachment?")) return;
//     setProcessingDocId(appointmentId);
//     try {
//       await patientEndpoints.deleteAppointmentDocument(documentId);
//       const docRes = await patientEndpoints.getDocumentsForAppointment(appointmentId);
//       setActiveAppointmentDocs(prev => ({ ...prev, [appointmentId]: docRes.data?.documents || docRes.data || [] }));
//     } catch (err) {
//       alert('Purge operation rejected at remote storage clearance point.');
//     } finally {
//       setProcessingDocId(null);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-2xl font-bold text-slate-900">Clinical Consultation Logs</h2>
//         <p className="text-slate-500 text-sm">Monitor history indices, status allocations, and manage attached supporting lab files.</p>
//       </div>

//       <Alert type="error" message={error} />

//       {loading ? <Loader /> : (
//         <div className="space-y-6">
//           {Array.isArray(appointments) && appointments.map((app) => {
//             const currentDocs = activeAppointmentDocs[app.id] || [];
//             return (
//               <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow">
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
//                   <div className="space-y-1">
//                     <div className="flex items-center gap-2 flex-wrap">
//                       <h4 className="font-extrabold text-slate-900 text-base">Consultation with Dr. {app.doctorName || 'Practitioner ID: ' + app.doctor_id}</h4>
//                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${app.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-brand-50 border-brand-200 text-brand-700'}`}>
//                         {app.status || 'Active Allocation'}
//                       </span>
//                     </div>
//                     <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
//                       <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {app.date} | {app.start || app.time}</span>
//                       <span className="flex items-center gap-1 capitalize"><Tag className="w-3.5 h-3.5" /> {app.type || 'Standard'} Mode</span>
//                     </div>
//                   </div>
                  
//                   {/* Binary Streams Attachment Input Button */}
//                   <div>
//                     <label className={`flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm select-none ${processingDocId === app.id ? 'opacity-40 pointer-events-none' : ''}`}>
//                       <Upload className="w-3.5 h-3.5" /> Attach Lab Report
//                       <input type="file" accept=".pdf,.docx,image/*" className="hidden" onChange={(e) => handleDocumentUpload(e, app.id)} />
//                     </label>
//                   </div>
//                 </div>

//                 {/* Grid Framework Listing Operational Row Attachments */}
//                 <div className="space-y-2">
//                   <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
//                     <Paperclip className="w-3 h-3" /> Attached Health Diagnostics Data Matrix ({currentDocs.length})
//                   </span>
                  
//                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
//                     {currentDocs.map((doc) => (
//                       <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 hover:bg-slate-100/60 transition-colors">
//                         <div className="flex items-center gap-2 truncate">
//                           <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
//                           <a href={doc.file_url || doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-700 hover:text-brand-600 truncate underline decoration-dotted">
//                             {doc.file_name || `DocNode_#${doc.id}`}
//                           </a>
//                         </div>
//                         <button onClick={() => handleDocumentDelete(doc.id, app.id)} className="text-slate-400 hover:text-rose-600 p-1 transition-colors flex-shrink-0">
//                           <Trash2 className="w-3.5 h-3.5" />
//                         </button>
//                       </div>
//                     ))}
                    
//                     {currentDocs.length === 0 && (
//                       <div className="col-span-full p-3 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-slate-400 italic text-[11px] flex items-center gap-1.5">
//                         <ShieldAlert className="w-3.5 h-3.5" /> No supporting diagnostics or clinical files mapped to this booking row.
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}

//           {appointments.length === 0 && (
//             <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium">
//               No historical clinic consultation events discovered inside this user portfolio context.
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { 
  getAppointmentStatusMeta, 
  handleCallDoctor 
} from '../../utils/appointmentActions';
import { 
  Calendar, Clock, Tag, FileText, Upload, Trash2, 
  MapPin, Phone, Eye, ChevronDown, FileCheck, X 
} from 'lucide-react';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [activeDocs, setActiveDocs] = useState({});
  const [prescriptions, setPrescriptions] = useState({});
  const [expandedHybridId, setExpandedHybridId] = useState(null);
  
  // Address Modal State
  const [addressModalData, setAddressModalData] = useState(null);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [processingDocId, setProcessingDocId] = useState(null);

  const syncAppointmentsList = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await patientEndpoints.listAppointments();
      const list = response.data?.appointments || response.data || [];
      setAppointments(list);

      if (Array.isArray(list)) {
        list.forEach(async (app) => {
          try {
            const docRes = await patientEndpoints.getDocumentsForAppointment(app.id);
            setActiveDocs(prev => ({ ...prev, [app.id]: docRes.data?.documents || docRes.data || [] }));

            const presRes = await patientEndpoints.getPrescriptionForAppointment(app.id);
            setPrescriptions(prev => ({ ...prev, [app.id]: presRes.data?.prescription || presRes.data }));
          } catch (e) {
            /* Handled gracefully */
          }
        });
      }
    } catch (err) {
      setError('Failed to fetch clinical consultation history logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { syncAppointmentsList(); }, []);

  // Fetches Doctor Address via doctor_user_id (or doctor_id)
  const handleFetchDoctorAddress = async (appointment) => {
    const doctorUserId = appointment.doctor_user_id || appointment.doctor_id || appointment.doctorId;
    if (!doctorUserId) {
      alert("Doctor ID unavailable for fetching clinic location.");
      return;
    }

    setFetchingAddress(true);
    try {
      const res = await patientEndpoints.getDoctorAddressByUserId(doctorUserId);
      const addresses = res.data?.addresses || res.data?.address || res.data || [];
      const primaryAddress = Array.isArray(addresses) ? addresses[0] : addresses;

      setAddressModalData({
        doctorName: appointment.doctorName || `Doctor #${doctorUserId}`,
        address: primaryAddress
      });
    } catch (err) {
      alert("Failed to retrieve clinic address from server.");
    } finally {
      setFetchingAddress(false);
    }
  };

  const handleDocumentUpload = async (e, appointmentId) => {
    const file = e.target.files[0];
    if (!file) return;
    setProcessingDocId(appointmentId);
    const fd = new FormData();
    fd.append('appointment_id', String(appointmentId));
    fd.append('document', file);

    try {
      await patientEndpoints.uploadAppointmentDocument(fd);
      const docRes = await patientEndpoints.getDocumentsForAppointment(appointmentId);
      setActiveDocs(prev => ({ ...prev, [appointmentId]: docRes.data?.documents || docRes.data || [] }));
    } catch (err) {
      alert('Document upload failed.');
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleDocumentDelete = async (documentId, appointmentId) => {
    if (!confirm("Permanently delete this medical document?")) return;
    setProcessingDocId(appointmentId);
    try {
      await patientEndpoints.deleteAppointmentDocument(documentId);
      const docRes = await patientEndpoints.getDocumentsForAppointment(appointmentId);
      setActiveDocs(prev => ({ ...prev, [appointmentId]: docRes.data?.documents || docRes.data || [] }));
    } catch (err) {
      alert('Delete failed.');
    } finally {
      setProcessingDocId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Clinical Consultation Logs</h2>
        <p className="text-slate-500 text-sm">Monitor appointment status, doctor prescriptions, and uploaded medical documents.</p>
      </div>

      <Alert type="error" message={error} />

      {loading ? <Loader /> : (
        <div className="space-y-6">
          {Array.isArray(appointments) && appointments.map((app) => {
            const statusMeta = getAppointmentStatusMeta(app.status);
            const currentDocs = activeDocs[app.id] || [];
            const currentPrescription = prescriptions[app.id];
            const type = (app.type || app.mode || 'offline').toLowerCase();

            return (
              <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-base">Dr. {app.doctorName || 'Practitioner ID: ' + (app.doctor_user_id || app.doctor_id)}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {app.date} at {app.start || app.time}</span>
                      <span className="flex items-center gap-1 capitalize"><Tag className="w-3.5 h-3.5" /> Type: {type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {(type === 'offline' || type === 'offline_walkin') && (
                      <button
                        disabled={fetchingAddress}
                        onClick={() => handleFetchDoctorAddress(app)}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors border border-slate-200 disabled:opacity-50"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> {fetchingAddress ? 'Fetching...' : 'Get Address'}
                      </button>
                    )}

                    {(type === 'online' || type === 'online_video') && (
                      <button
                        onClick={() => handleCallDoctor(app)}
                        className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Doctor
                      </button>
                    )}

                    {(type === 'hybrid') && (
                      <div className="relative">
                        <button
                          onClick={() => setExpandedHybridId(expandedHybridId === app.id ? null : app.id)}
                          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Actions <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {expandedHybridId === app.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 space-y-1 animate-fadeIn">
                            <button
                              onClick={() => { setExpandedHybridId(null); handleFetchDoctorAddress(app); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
                            >
                              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Get Address
                            </button>
                            <button
                              onClick={() => { setExpandedHybridId(null); handleCallDoctor(app); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-lg"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call Doctor
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-brand-600" /> Doctor Prescriptions
                  </span>
                  {currentPrescription ? (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                      <p className="font-bold text-slate-800">{currentPrescription.title || "Consultation Prescription"}</p>
                      <p className="text-slate-600">{currentPrescription.details || currentPrescription.notes || "Take prescribed dosage as instructed."}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs">No prescriptions provided by doctor yet.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Uploaded Documents ({currentDocs.length})
                    </span>
                    <label className={`flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${processingDocId === app.id ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="w-3.5 h-3.5" /> Upload File
                      <input type="file" accept=".pdf,.docx,image/*" className="hidden" onChange={(e) => handleDocumentUpload(e, app.id)} />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {currentDocs.map((doc) => (
                      <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <a href={doc.file_url || doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-700 hover:text-brand-600 truncate underline">
                            {doc.file_name || `Document #${doc.id}`}
                          </a>
                        </div>
                        <button onClick={() => handleDocumentDelete(doc.id, app.id)} className="text-slate-400 hover:text-rose-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addressModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 relative animate-fadeIn">
            <button onClick={() => setAddressModalData(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-brand-600 font-bold text-lg">
              <MapPin className="w-5 h-5 text-rose-500" /> Clinic Address
            </div>
            {addressModalData.address ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1 text-sm text-slate-700 font-medium">
                <p className="font-bold text-slate-900">{addressModalData.doctorName}</p>
                <p>{addressModalData.address.street} {addressModalData.address.house_no ? `, Apt ${addressModalData.address.house_no}` : ''}</p>
                <p>{addressModalData.address.city}, {addressModalData.address.state}</p>
                <p className="font-bold text-slate-800">Pincode: {addressModalData.address.pincode}</p>
                {addressModalData.address.landmark && <p className="text-xs text-slate-400 italic">Ref: {addressModalData.address.landmark}</p>}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No address recorded for this doctor.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}