import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { 
  getAppointmentStatusMeta, 
  handleCallDoctor 
} from '../../utils/appointmentActions';
import { 
  ArrowLeft, Calendar, Clock, Video, MapPin, User, Mail, 
  Phone, IndianRupee, FileText, Upload, Trash2, FileCheck, X, ShieldCheck 
} from 'lucide-react';

export default function AppointmentDetails({ appointment, onBack }) {
  const [documents, setDocuments] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Address Modal State
  const [addressModalData, setAddressModalData] = useState(null);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const doctor = appointment?.doctor || {};
  const profile = doctor.doctorProfile || {};
  const statusMeta = getAppointmentStatusMeta(appointment?.appointment_status);
  const appType = (appointment?.appointment_type || '').toLowerCase();

  // Helper to handle multi-escaped JSON strings with full debugging
  const parseSlots = (rawSlots) => {
    console.log("🔍 [DEBUG] 1. rawSlots received in parseSlots helper:", rawSlots);
    console.log("🔍 [DEBUG] 1a. Type of rawSlots:", typeof rawSlots);

    if (!rawSlots) {
      console.warn("⚠️ [DEBUG] rawSlots is empty or undefined!");
      return [];
    }

    let data = rawSlots;

    for (let i = 0; i < 5; i++) {
      if (typeof data === 'string') {
        console.log(`🔍 [DEBUG] Layer ${i + 1} parsing attempt... Data preview:`, data.substring(0, 80));
        try {
          data = JSON.parse(data);
          console.log(`✅ [DEBUG] Layer ${i + 1} parsed successfully. New type:`, typeof data);
        } catch (e) {
          console.warn(`⚠️ [DEBUG] Standard JSON.parse failed at layer ${i + 1}:`, e.message);
          try {
            const cleaned = data.replace(/\\"/g, '"').replace(/^"|"$/g, '');
            console.log(`🧹 [DEBUG] Cleaned data preview:`, cleaned.substring(0, 80));
            data = JSON.parse(cleaned);
            console.log(`✅ [DEBUG] Cleaned parsing succeeded at layer ${i + 1}.`);
          } catch (err) {
            console.error(`❌ [DEBUG] Unrecoverable parse error at layer ${i + 1}:`, err.message);
            break;
          }
        }
      } else {
        console.log(`🎉 [DEBUG] Parsing complete at layer ${i}. Final type is object/array.`);
        break;
      }
    }

    const isArr = Array.isArray(data);
    console.log("🔍 [DEBUG] Is final parsed result an Array?", isArr);
    if (isArr) {
      console.log("📊 [DEBUG] Total days parsed in slots:", data.length);
      console.log("📊 [DEBUG] First day sample:", data[0]);
    } else {
      console.error("❌ [DEBUG] Parsed slots did NOT result in an array. Actual value:", data);
    }

    return isArr ? data : [];
  };

  const syncAppointmentExtraData = async () => {
    console.log("🚀 [DEBUG] Starting syncAppointmentExtraData()...");
    console.log("📋 [DEBUG] Incoming appointment prop:", appointment);

    if (!appointment?.id) {
      console.warn("⚠️ [DEBUG] appointment.id missing! Aborting extra data fetch.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Fetch Documents
      console.log("📡 [DEBUG] Fetching appointment documents for ID:", appointment.id);
      const docRes = await patientEndpoints.getDocumentsForAppointment(appointment.id);
      console.log("📩 [DEBUG] Raw Documents response:", docRes);
      setDocuments(docRes.data?.documents || docRes.data || []);

      // 2. Fetch Prescription
      console.log("📡 [DEBUG] Fetching prescriptions for ID:", appointment.id);
      const presRes = await patientEndpoints.getPrescriptionForAppointment(appointment.id);
      console.log("📩 [DEBUG] Raw Prescription response:", presRes);
      setPrescription(presRes.data?.prescription || presRes.data || null);

      // 3. Fetch Doctor Slots
      const doctorId = appointment.doctor_id || doctor.id || doctor.user_id;
      console.log("🩺 [DEBUG] Resolved Doctor ID for slots:", doctorId);

      if (doctorId && patientEndpoints.getDoctorSlots) {
        console.log("📡 [DEBUG] Calling patientEndpoints.getDoctorSlots(" + doctorId + ")...");
        const slotRes = await patientEndpoints.getDoctorSlots(doctorId);
        console.log("📩 [DEBUG] Raw API Slot Response:", slotRes);
        console.log("📩 [DEBUG] slotRes.data:", slotRes.data);

        const slotsArray = slotRes.data?.slots || slotRes.data || [];
        console.log("📩 [DEBUG] Extracted slotsArray:", slotsArray);

        const rawSlots = slotsArray[0]?.slots || '';
        console.log("📩 [DEBUG] Extracted rawSlots string field:", rawSlots);

        const parsedResult = parseSlots(rawSlots);
        console.log("💾 [DEBUG] Setting availableSlots state with:", parsedResult);
        setAvailableSlots(parsedResult);
      } else {
        console.warn("⚠️ [DEBUG] Missing doctorId or patientEndpoints.getDoctorSlots method!");
      }
    } catch (err) {
      console.error("❌ [DEBUG] Error in syncAppointmentExtraData():", err);
    } finally {
      setLoading(false);
      console.log("🏁 [DEBUG] Finished syncAppointmentExtraData()");
    }
  };

  useEffect(() => {
    console.log("🔄 [DEBUG] useEffect triggered due to appointment prop change.");
    syncAppointmentExtraData();
  }, [appointment]);

  // Fetch Clinic Address using doctor's user_id
  const handleFetchAddress = async () => {
    const doctorUserId = doctor.user_id || doctor.id || appointment.doctor_id;
    console.log("📍 [DEBUG] Fetching address for Doctor User ID:", doctorUserId);
    setFetchingAddress(true);
    try {
      const res = await patientEndpoints.getDoctorAddressByUserId(doctorUserId);
      console.log("📩 [DEBUG] Raw address response:", res);
      const addresses = res.data?.addresses || res.data?.address || res.data || [];
      const primaryAddress = Array.isArray(addresses) ? addresses[0] : addresses;

      setAddressModalData({
        doctorName: doctor.username || 'Doctor',
        address: primaryAddress
      });
    } catch (err) {
      console.error("❌ [DEBUG] Address fetch failed:", err);
      alert("Failed to retrieve clinic address from server.");
    } finally {
      setFetchingAddress(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    console.log("📤 [DEBUG] Uploading file:", file.name);
    setUploadingDoc(true);
    const fd = new FormData();
    fd.append('appointment_id', String(appointment.id));
    fd.append('document', file);

    try {
      await patientEndpoints.uploadAppointmentDocument(fd);
      console.log("✅ [DEBUG] Upload successful. Syncing data...");
      syncAppointmentExtraData();
    } catch (err) {
      console.error("❌ [DEBUG] Document upload failed:", err);
      alert('Document upload failed.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentDelete = async (documentId) => {
    if (!confirm("Permanently delete this medical document?")) return;
    console.log("🗑️ [DEBUG] Deleting document ID:", documentId);
    try {
      await patientEndpoints.deleteAppointmentDocument(documentId);
      console.log("✅ [DEBUG] Delete successful. Syncing data...");
      syncAppointmentExtraData();
    } catch (err) {
      console.error("❌ [DEBUG] Document delete failed:", err);
      alert('Failed to delete document.');
    }
  };

  const formattedDate = appointment?.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : 'N/A';

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Consultations
      </button>

      <Alert type="error" message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Summary Card */}
        <div className="lg:col-span-1 space-y-6">
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
                <IndianRupee className="w-4 h-4 text-slate-400" /> <span className="text-slate-900 font-bold">₹{profile.consultation_fee} Fee</span>
              </div>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Quick Actions</span>
            
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
                onClick={handleFetchAddress}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-colors border border-slate-200"
              >
                <MapPin className="w-4 h-4 text-rose-500" /> {fetchingAddress ? 'Fetching Address...' : 'Get Clinic Address'}
              </button>
            )}

            {appType === 'hybrid' && (
              <div className="space-y-2">
                <button
                  disabled={fetchingAddress}
                  onClick={handleFetchAddress}
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

        {/* Appointment Meta & Files Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Booking ID #{appointment.id}</span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">Consultation Summary</h4>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </span>
              </div>
            </div>

            {/* Time & Type Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">Date & Schedule</span>
                <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-600" /> {formattedDate}
                </p>
                <p className="text-slate-600 font-semibold flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {appointment.appointment_start_time} - {appointment.appointment_end_time}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">Consultation Variant</span>
                <p className="font-extrabold text-slate-800 text-sm capitalize flex items-center gap-1.5">
                  {appType === 'online_video' ? <Video className="w-4 h-4 text-brand-500" /> : <MapPin className="w-4 h-4 text-rose-500" />}
                  {appointment.appointment_type?.replace('_', ' ')}
                </p>
                <p className="text-slate-600 font-semibold capitalize mt-1">
                  Payment Mode: <strong className="text-slate-800">{appointment.payment_mode}</strong>
                </p>
              </div>
            </div>

            {/* Available Doctor Schedule / Slots */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-600" /> Doctor's Availability Schedule
              </span>
              
              {availableSlots.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {availableSlots.map((dayData, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="text-xs font-bold text-slate-800 capitalize flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                          {dayData.day} ({dayData.date})
                        </span>
                        {dayData.mode && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                            {dayData.mode}
                          </span>
                        )}
                      </div>

                      {dayData.slots && dayData.slots.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {dayData.slots.map((s, slotIdx) => (
                            <span 
                              key={slotIdx}
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-1 rounded-md shadow-2xs"
                            >
                              <Clock className="w-3 h-3 text-slate-400" />
                              {s.start} - {s.end}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No available slots for this date.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                  No availability slots listed for this doctor.
                </div>
              )}
            </div>

            {/* Prescriptions Section */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-brand-600" /> Doctor Prescriptions
              </span>
              {prescription ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900 text-sm">{prescription.title || "Consultation Prescription"}</p>
                  <p className="text-slate-600 leading-relaxed">{prescription.details || prescription.notes || "Take prescribed dosage as instructed."}</p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                  No prescriptions provided for this consultation yet.
                </div>
              )}
            </div>

            {/* Uploaded Documents List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Attached Medical Documents ({documents.length})
                </span>
                <label className={`flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload className="w-3.5 h-3.5" /> Upload File
                  <input type="file" accept=".pdf,.docx,image/*" className="hidden" onChange={handleDocumentUpload} />
                </label>
              </div>

              {loading ? <Loader /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <a 
                          href={doc.file_url || doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-bold text-slate-700 hover:text-brand-600 truncate underline"
                        >
                          {doc.file_name || `Document #${doc.id}`}
                        </a>
                      </div>
                      <button onClick={() => handleDocumentDelete(doc.id)} className="text-slate-400 hover:text-rose-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {documents.length === 0 && (
                    <div className="col-span-full p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                      No supporting documents uploaded for this appointment.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Popup Modal */}
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