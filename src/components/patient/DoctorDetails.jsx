import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Alert from '../ui/Alert';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

import DoctorProfileSidebar from './doctor/DoctorProfileSidebar';
import SlotSelectionMatrix from './doctor/SlotSelectionMatrix';
import DoctorReviewsSection from './doctor/DoctorReviewsSection';
import { getSelectedItem, clearSelectedItem } from '../../utils/navigationStorage';

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

export default function DoctorDetails({ doctor: propDoctor, onBack }) {
  // Read active doctor from prop or the single stored item
  const doctor = propDoctor || getSelectedItem('doctor');

  const [slotsData, setSlotsData] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const [selectedModes, setSelectedModes] = useState({ online: true, offline: true, hybrid: true });
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [chosenMode, setChosenMode] = useState(''); 
  const [paymentMode, setPaymentMode] = useState(''); 
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    const fetchFreshDoctorData = async () => {
      if (!doctor) return;
      setLoading(true);
      setError('');
      try {
        const targetId = doctor.user_id || doctor.id;
        
        // Live API call for current consultation slots
        const slotsResponse = await patientEndpoints.showDoctorSlots(targetId);
        const rawSlotsString = slotsResponse.data?.slots?.[0]?.slots || slotsResponse.data?.slots || doctor.user?.doctorSlots?.slots;
        const parsedSlots = parseSlots(rawSlotsString);
        
        if (parsedSlots.length > 0) {
          const validDays = parsedSlots.filter(day => day.slots && day.slots.length > 0);
          setSlotsData(validDays);
        } else {
          setSlotsData([]);
        }

        // Live API call for current ratings and reviews
        const reviewsResponse = await patientEndpoints.getDoctorRating(targetId);
        setReviews(reviewsResponse.data?.reviews || reviewsResponse.data || []);
      } catch (err) {
        setReviews([]);
        setError(err.response?.data?.message || 'Failed to fetch doctor availability slots.');
      } finally {
        setLoading(false);
      }
    };

    fetchFreshDoctorData();
  }, [doctor]);

  const handleBack = () => {
    clearSelectedItem('doctor');
    onBack();
  };

  if (!doctor) {
    return (
      <div className="bg-white p-8 text-center rounded-2xl border border-slate-200">
        <p className="text-slate-500 mb-4 font-medium">No doctor selected or session expired.</p>
        <button onClick={handleBack} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Return to Directory
        </button>
      </div>
    );
  }

  const filteredDays = slotsData.filter(dayObj => {
    const dayMode = (dayObj.mode || '').toLowerCase();
    if (!dayMode) return true;
    if (selectedModes.online && dayMode === 'online') return true;
    if (selectedModes.offline && dayMode === 'offline') return true;
    if (selectedModes.hybrid && dayMode === 'hybrid') return true;
    if (selectedModes.online && dayMode === 'hybrid') return true;
    if (selectedModes.offline && dayMode === 'hybrid') return true;
    return false;
  });

  const handleToggleMode = (modeKey) => {
    setSelectedModes(p => ({ ...p, [modeKey]: !p[modeKey] }));
    setSelectedDayIndex(null);
    setSelectedSlot(null);
  };

  const handleSelectDay = (actualIndexInFiltered) => {
    setSelectedDayIndex(actualIndexInFiltered);
    setSelectedSlot(null);
    
    const dayObj = filteredDays[actualIndexInFiltered];
    const dayMode = (dayObj.mode || '').toLowerCase();
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

  const handleModeChange = (val) => {
    setChosenMode(val);
    if (val === 'online') setPaymentMode('card');
    else if (val === 'offline') setPaymentMode('cash');
    else setPaymentMode('');
  };

  const resetSelection = () => {
    setSelectedSlot(null);
    setChosenMode('');
    setPaymentMode('');
  };

  const executeAppointmentBooking = async () => {
    if (!selectedSlot || !chosenMode || !paymentMode) {
      setError('Please select a slot, consultation mode, and payment method.');
      return;
    }

    setSubmittingBooking(true);
    setError('');
    
    const doctorId = Number(doctor.user_id || doctor.id);

    try {
      const targetDay = filteredDays[selectedDayIndex];
      const payload = {
        doctor_id: doctorId,
        date: targetDay.date,
        start: selectedSlot.start,
        end: selectedSlot.end,
        type: chosenMode === 'online' ? 'online_video' : 'offline',
        payment_mode: paymentMode
      };

      const appointmentRes = await patientEndpoints.createAppointment(payload);
      const resData = appointmentRes.data;
      
      const createdAppointmentId = resData.createdAppointment?.id || resData.id;
      const { orderId, amount: totalAmount, key } = resData;

      if (!createdAppointmentId) {
        throw new Error('Failed to obtain valid Appointment ID from server.');
      }

      if (paymentMode === 'cash') {
        setBookingSuccess(`Appointment #${createdAppointmentId} scheduled successfully for Cash Payment!`);
        resetSelection();
        setSubmittingBooking(false);
        return;
      }

      if (paymentMode === 'card') {
        if (!orderId) throw new Error('Failed to retrieve Razorpay Order ID.');
        if (!window.Razorpay) throw new Error('Razorpay SDK script not loaded in index.html.');

        const options = {
          key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: totalAmount,
          currency: "INR",
          name: "DocApp Healthcare",
          description: `Appointment with ${doctor.user?.username || doctor.username || 'Doctor'}`,
          order_id: orderId,
          prefill: {
            name: doctor.user?.username || doctor.username || "",
            email: doctor.user?.email || doctor.email || "",
            contact: doctor.user?.phone_number || doctor.phone_number || ""
          },
          theme: { color: "#2563eb" },
          modal: {
            ondismiss: function () {
              setSubmittingBooking(false);
              setError("Payment window closed.");
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Booking execution failed.');
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={handleBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" /> Return to Directory
      </button>

      {bookingSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-bold">{bookingSuccess}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DoctorProfileSidebar
          doctor={doctor}
          selectedModes={selectedModes}
          onToggleMode={handleToggleMode}
        />

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <Alert type="error" message={error} />

          <SlotSelectionMatrix
            loading={loading}
            filteredDays={filteredDays}
            selectedDayIndex={selectedDayIndex}
            selectedSlot={selectedSlot}
            chosenMode={chosenMode}
            paymentMode={paymentMode}
            submittingBooking={submittingBooking}
            onSelectDay={handleSelectDay}
            onSelectSlot={(slot) => { setSelectedSlot(slot); setBookingSuccess(''); setError(''); }}
            onChangeMode={handleModeChange}
            onChangePaymentMode={setPaymentMode}
            onSubmitBooking={executeAppointmentBooking}
          />

          <DoctorReviewsSection reviews={reviews} />
        </div>
      </div>
    </div>
  );
}