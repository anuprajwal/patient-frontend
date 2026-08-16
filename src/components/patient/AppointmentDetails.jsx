// src/components/patient/AppointmentDetails.jsx

import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Alert from '../ui/Alert';
import DoctorSlotPicker from './DoctorSlotPicker';
import DoctorSummaryCard from './appointment-details/DoctorSummaryCard';
import CheckupTimelineCard from './appointment-details/CheckupTimelineCard';
import PrescriptionAndDocuments from './appointment-details/PrescriptionAndDocuments';
import { getAppointmentStatusMeta } from '../../utils/appointmentActions';
import { ArrowLeft, Calendar, Clock, Video, MapPin, X, CheckCircle2, CalendarPlus } from 'lucide-react';

const parseSlots = (rawSlots) => {
  if (!rawSlots) return [];
  let data = rawSlots;
  for (let i = 0; i < 5; i++) {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        try {
          const cleaned = data.replace(/\\"/g, '"').replace(/^"|"$/g, '');
          data = JSON.parse(cleaned);
        } catch (err) {
          break;
        }
      }
    } else {
      break;
    }
  }
  return Array.isArray(data) ? data : [];
};

export default function AppointmentDetails({ appointment, onBack }) {
  const [documents, setDocuments] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Address Modal State
  const [addressModalData, setAddressModalData] = useState(null);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Checkup Scheduling Modal & Logic State
  const [showCheckupModal, setShowCheckupModal] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsData, setSlotsData] = useState([]);
  const [selectedModes, setSelectedModes] = useState({ online: true, offline: true, hybrid: true });
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [chosenMode, setChosenMode] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [submittingCheckup, setSubmittingCheckup] = useState(false);
  const [checkupError, setCheckupError] = useState('');

  const doctor = appointment?.doctor || {};
  const profile = doctor.doctorProfile || {};
  const statusMeta = getAppointmentStatusMeta(appointment?.appointment_status);
  const appType = (appointment?.appointment_type || '').toLowerCase();
  const isAppointmentClosed = (appointment?.appointment_status || '').toLowerCase() === 'closed';
  const checkupAppointments = Array.isArray(appointment?.checkupAppointment) ? appointment.checkupAppointment : [];

  const syncAppointmentExtraData = async () => {
    if (!appointment?.id) return;
    setLoading(true);
    setError('');
    try {
      const docRes = await patientEndpoints.getDocumentsForAppointment(appointment.id);
      setDocuments(docRes.data?.documents || docRes.data || []);

      const presRes = await patientEndpoints.getPrescriptionForAppointment(appointment.id);
      setPrescription(presRes.data?.prescription || presRes.data || null);
    } catch (err) {
      /* Silent error handling */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncAppointmentExtraData();
  }, [appointment]);

  const handleOpenCheckupModal = async () => {
    setShowCheckupModal(true);
    setSlotsLoading(true);
    setCheckupError('');
    setSelectedDayIndex(null);
    setSelectedSlot(null);
    setChosenMode('');
    setPaymentMode('');

    try {
      const targetDoctorId = doctor.user_id || doctor.id || appointment.doctor_id;
      const slotsResponse = await patientEndpoints.showDoctorSlots(targetDoctorId);
      const rawSlotsString = slotsResponse.data?.slots?.[0]?.slots || slotsResponse.data?.slots;
      const parsed = parseSlots(rawSlotsString);

      // Filter slots starting 5 days after appointment date
      const parentDate = new Date(appointment.appointment_date);
      const minCheckupDate = new Date(parentDate);
      minCheckupDate.setDate(minCheckupDate.getDate() + 5);

      const validDaysAfter5Days = parsed.filter(dayObj => {
        if (!dayObj.slots || dayObj.slots.length === 0) return false;
        if (!dayObj.date) return false;
        return new Date(dayObj.date) >= minCheckupDate;
      });

      setSlotsData(validDaysAfter5Days);
    } catch (err) {
      setCheckupError("Failed to retrieve doctor's schedule for follow-up checkup.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const filteredDays = slotsData.filter(dayObj => {
    const dayMode = (dayObj.mode || '').toLowerCase();
    if (!dayMode) return true;
    if (selectedModes.online && dayMode === 'online') return true;
    if (selectedModes.offline && dayMode === 'offline') return true;
    if (selectedModes.hybrid && (dayMode === 'hybrid' || selectedModes.online || selectedModes.offline)) return true;
    return false;
  });

  const handleSelectDay = (idx) => {
    setSelectedDayIndex(idx);
    setSelectedSlot(null);
    const dayObj = filteredDays[idx];
    const dayMode = (dayObj?.mode || '').toLowerCase();
    if (dayMode === 'online') {
      setChosenMode('online');
      setPaymentMode('card');
    } else if (dayMode === 'offline') {
      setChosenMode('offline');
      setPaymentMode('cash');
    } else {
      setChosenMode('');
      setPaymentMode('');
    }
  };

  const handleToggleMode = (modeKey) => {
    setSelectedModes(prev => ({ ...prev, [modeKey]: !prev[modeKey] }));
    setSelectedDayIndex(null);
    setSelectedSlot(null);
  };

  const handleExecuteCheckupSchedule = async () => {
    if (!selectedSlot || !chosenMode) {
      setCheckupError('Please pick an available slot and consultation variant.');
      return;
    }

    setSubmittingCheckup(true);
    setCheckupError('');

    const targetDay = filteredDays[selectedDayIndex];
    const payload = {
      appointment_id: String(appointment.id),
      date: targetDay.date,
      start: selectedSlot.start,
      end: selectedSlot.end,
      type: chosenMode === 'online' ? 'online_video' : 'offline',
      payment_mode: paymentMode || (chosenMode === 'online' ? 'card' : 'cash')
    };

    try {
      const response = await patientEndpoints.scheduleCheckupAppointment(payload);
      const resData = response.data;

      // FREE Checkup Flow
      if (resData.free || !resData.orderId) {
        setShowCheckupModal(false);
        setSuccessMessage(`Checkup scheduled successfully! (Ref #${resData.appointment_id || resData.checkup?.id})`);
        setSubmittingCheckup(false);
        return;
      }

      // PAID Checkup Flow via Razorpay
      const { orderId, amount: totalAmount, key } = resData;
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK script is unavailable.');
      }

      const rzpOptions = {
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: totalAmount,
        currency: "INR",
        name: "DocApp Healthcare",
        description: `Follow-up Checkup with Dr. ${doctor.username || 'Doctor'}`,
        order_id: orderId,
        handler: async function (razorpayResponse) {
          try {
            const verifyRes = await patientEndpoints.verifyPayment({
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature
            });

            if (verifyRes.data?.success) {
              setShowCheckupModal(false);
              setSuccessMessage(`Payment confirmed! Checkup appointment scheduled successfully.`);
            } else {
              setCheckupError(verifyRes.data?.message || 'Payment verification failed.');
            }
          } catch (err) {
            setCheckupError(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setSubmittingCheckup(false);
          }
        },
        prefill: {
          name: doctor.username || "",
          email: doctor.email || "",
          contact: doctor.phone_number || ""
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: function () {
            setSubmittingCheckup(false);
            setCheckupError("Payment window closed.");
          }
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
    } catch (err) {
      setCheckupError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to schedule checkup.');
      setSubmittingCheckup(false);
    }
  };

  const handleFetchAddress = async () => {
    const doctorUserId = doctor.user_id || doctor.id || appointment.doctor_id;
    setFetchingAddress(true);
    try {
      const res = await patientEndpoints.getDoctorAddressByUserId(doctorUserId);
      const addresses = res.data?.addresses || res.data?.address || res.data || [];
      const primaryAddress = Array.isArray(addresses) ? addresses[0] : addresses;

      setAddressModalData({
        doctorName: doctor.username || 'Doctor',
        address: primaryAddress
      });
    } catch (err) {
      alert("Failed to retrieve clinic address from server.");
    } finally {
      setFetchingAddress(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(true);
    const fd = new FormData();
    fd.append('appointment_id', String(appointment.id));
    fd.append('document', file);

    try {
      await patientEndpoints.uploadAppointmentDocument(fd);
      syncAppointmentExtraData();
    } catch (err) {
      alert('Document upload failed.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentDelete = async (documentId) => {
    if (!confirm("Permanently delete this medical document?")) return;
    try {
      await patientEndpoints.deleteAppointmentDocument(documentId);
      syncAppointmentExtraData();
    } catch (err) {
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

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-bold">{successMessage}</p>
        </div>
      )}

      <Alert type="error" message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Doctor Profile Card & Action Matrix */}
        <div className="lg:col-span-1">
          <DoctorSummaryCard 
            doctor={doctor}
            profile={profile}
            appointment={appointment}
            isAppointmentClosed={isAppointmentClosed}
            onOpenCheckupModal={handleOpenCheckupModal}
            onFetchAddress={handleFetchAddress}
            fetchingAddress={fetchingAddress}
          />
        </div>

        {/* Right Column: Main Consultation Info, Distinct Checkup Block & Medical Records */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Booking #{appointment.id}</span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">Primary Consultation Details</h4>
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
                <span className="text-slate-400 font-bold uppercase block text-[10px]">Date & Time</span>
                <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-600" /> {formattedDate}
                </p>
                <p className="text-slate-600 font-semibold flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {appointment.appointment_start_time} - {appointment.appointment_end_time}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase block text-[10px]">Consultation Type</span>
                <p className="font-extrabold text-slate-800 text-sm capitalize flex items-center gap-1.5">
                  {appType === 'online_video' ? <Video className="w-4 h-4 text-brand-500" /> : <MapPin className="w-4 h-4 text-rose-500" />}
                  {appointment.appointment_type?.replace('_', ' ')}
                </p>
                <p className="text-slate-600 font-semibold capitalize mt-1">
                  Payment Mode: <strong className="text-slate-800">{appointment.payment_mode}</strong>
                </p>
              </div>
            </div>

            {/* Prescriptions & Attached Documents Sub-Component */}
            <PrescriptionAndDocuments
              prescription={prescription}
              rawPrescriptionString={appointment.prescription}
              documents={documents}
              loading={loading}
              uploadingDoc={uploadingDoc}
              onDocumentUpload={handleDocumentUpload}
              onDocumentDelete={handleDocumentDelete}
            />
          </div>

          {/* Distinct Follow-up Checkup Appointments Section */}
          <CheckupTimelineCard checkups={checkupAppointments} />
        </div>
      </div>

      {/* Checkup Booking Modal */}
      {showCheckupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl p-6 space-y-5 relative my-8 animate-fadeIn">
            <button 
              onClick={() => setShowCheckupModal(false)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-brand-600 font-bold text-lg">
                <CalendarPlus className="w-5 h-5 text-emerald-600" /> Schedule Follow-up Checkup
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Showing available slots for Dr. {doctor.username || 'Doctor'} starting 5 days after appointment #{appointment.id}.
              </p>
            </div>

            <DoctorSlotPicker
              loading={slotsLoading}
              error={checkupError}
              filteredDays={filteredDays}
              selectedDayIndex={selectedDayIndex}
              onSelectDay={handleSelectDay}
              selectedSlot={selectedSlot}
              onSelectSlot={(slot) => { setSelectedSlot(slot); setCheckupError(''); }}
              selectedModes={selectedModes}
              onToggleMode={handleToggleMode}
              chosenMode={chosenMode}
              onChangeChosenMode={(mode) => {
                setChosenMode(mode);
                if (mode === 'online') setPaymentMode('card');
                else setPaymentMode('');
              }}
              paymentMode={paymentMode}
              onChangePaymentMode={(pm) => setPaymentMode(pm)}
              onProceed={handleExecuteCheckupSchedule}
              submitting={submittingCheckup}
              submitButtonText="Confirm Checkup Booking"
              isCheckup={true}
            />
          </div>
        </div>
      )}

      {/* Clinic Address Modal */}
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