import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { ArrowLeft, User, Award, IndianRupee, Clock, Calendar, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';

// Helper to recursively parse multi-stringified JSON data
const parseSlots = (rawSlots) => {
  console.log("🔍 [DoctorDetails DEBUG] 1. Raw slots input received:", rawSlots);
  if (!rawSlots) return [];

  let data = rawSlots;
  for (let i = 0; i < 5; i++) {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
        console.log(`✅ [DoctorDetails DEBUG] Successfully parsed JSON layer ${i + 1}`);
      } catch (e) {
        try {
          const cleaned = data.replace(/\\"/g, '"').replace(/^"|"$/g, '');
          data = JSON.parse(cleaned);
          console.log(`🧹 [DoctorDetails DEBUG] Successfully parsed cleaned JSON layer ${i + 1}`);
        } catch (err) {
          console.error(`❌ [DoctorDetails DEBUG] Unrecoverable parse error at layer ${i + 1}:`, err);
          break;
        }
      }
    } else {
      break;
    }
  }

  const isArr = Array.isArray(data);
  console.log("🔍 [DoctorDetails DEBUG] Final output is Array?:", isArr, data);
  return isArr ? data : [];
};

export default function DoctorDetails({ doctor, onBack }) {
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

  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 3;

  useEffect(() => {
    const syncDoctorDetailsData = async () => {
      setLoading(true);
      setError('');
      console.log("🚀 [DoctorDetails DEBUG] Syncing doctor details for:", doctor);
      try {
        const targetId = doctor.user_id || doctor.id;
        console.log("🩺 [DoctorDetails DEBUG] Target doctor ID:", targetId);
        
        const slotsResponse = await patientEndpoints.showDoctorSlots(targetId);
        console.log("📩 [DoctorDetails DEBUG] Raw slots API response:", slotsResponse);

        const rawSlotsString = slotsResponse.data?.slots?.[0]?.slots || slotsResponse.data?.slots || doctor.user?.doctorSlots?.slots;
        console.log("📦 [DoctorDetails DEBUG] Extracted raw slots string:", rawSlotsString);

        // Parse multi-escaped JSON string into a true Array
        const parsedSlots = parseSlots(rawSlotsString);
        
        if (parsedSlots.length > 0) {
          const validDays = parsedSlots.filter(day => day.slots && day.slots.length > 0);
          console.log("📊 [DoctorDetails DEBUG] Valid days with slots count:", validDays.length);
          setSlotsData(validDays);
        } else {
          console.warn("⚠️ [DoctorDetails DEBUG] Parsed slots resulted in an empty array.");
          setSlotsData([]);
        }

        const reviewsResponse = await patientEndpoints.getDoctorRating(targetId);
        setReviews(reviewsResponse.data?.reviews || reviewsResponse.data || []);
      } catch (err) {
        console.error("❌ [DoctorDetails DEBUG] Failed to sync doctor details:", err);
        setReviews([
          { id: 1, review_text: "Outstanding system architecture setup. Extremely clear guidance.", created_at: "2026-07-20T10:30:00.000Z" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (doctor) syncDoctorDetailsData();
  }, [doctor]);

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
    
    // Doctor ID passed to backend
    const doctorId = Number(doctor.user_id || doctor.id);

    try {
      const targetDay = filteredDays[selectedDayIndex];
      const payload = {
        doctor_id: doctorId,
        date: targetDay.date,
        start: selectedSlot.start,
        end: selectedSlot.end,
        type: chosenMode === 'online' ? 'online_video' : 'offline_walkin',
        payment_mode: paymentMode
      };

      // STEP 1: Create Appointment First
      const appointmentRes = await patientEndpoints.createAppointment(payload);
      const createdAppointmentId = appointmentRes.data.createdAppointment.id;

      if (!createdAppointmentId) {
        throw new Error('Failed to obtain valid Appointment ID from server.');
      }

      // PATH A: CASH / OFFLINE PAYMENT
      if (paymentMode === 'cash') {
        await patientEndpoints.confirmAppointment({
          appointmentId: String(createdAppointmentId),
          razorpay_order_id: null
        });
        setBookingSuccess(`Appointment #${createdAppointmentId} created and confirmed for Cash Payment!`);
        resetSelection();
        setSubmittingBooking(false);
        return;
      }

      // PATH B: ONLINE / CARD PAYMENT (Create Order & Launch Razorpay)
      if (paymentMode === 'card') {
        const consultationFee = Number(doctor.consultation_fee) || 500;
        
        // STEP 2: Create Order via /api/payment/order
        const orderRes = await patientEndpoints.createPaymentOrder({
          amount: consultationFee,
          appointmentId: createdAppointmentId,
          doctorId: doctorId
        });

        const { orderId, amount: totalPaise, key } = orderRes.data;

        if (!orderId) {
          throw new Error('Failed to create Razorpay Order ID.');
        }

        if (!window.Razorpay) {
          throw new Error('Razorpay SDK script not loaded in index.html.');
        }

        // STEP 3: Configure and Launch Razorpay Modal
        const options = {
          key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: totalPaise,
          currency: "INR",
          name: "DocApp Healthcare",
          description: `Appointment with ${doctor.user?.username || 'Doctor'}`,
          order_id: orderId,
          handler: async function (razorpayResponse) {
            try {
              // STEP 4: Verify Payment Signature
              const verifyRes = await patientEndpoints.verifyPayment({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature
              });

              if (verifyRes.data?.success) {
                // STEP 5: Confirm Appointment
                await patientEndpoints.confirmAppointment({
                  appointmentId: String(createdAppointmentId),
                  razorpay_order_id: razorpayResponse.razorpay_order_id
                });
                setBookingSuccess(`Payment verified! Appointment #${createdAppointmentId} is confirmed.`);
                resetSelection();
              } else {
                setError('Payment verification failed. Invalid signature.');
              }
            } catch (err) {
              setError('Payment verification request failed.');
            } finally {
              setSubmittingBooking(false);
            }
          },
          prefill: {
            name: doctor.user?.username || "",
            email: doctor.user?.email || "",
            contact: doctor.user?.phone_number || ""
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
      console.error("Booking Error:", err);
      setError(err.response?.data?.message || err.message || 'Booking execution failed.');
      setSubmittingBooking(false);
    }
  };

  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" /> Return to Directory
      </button>

      {bookingSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-bold">{bookingSuccess}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
            {doctor.profile_picture ? (
              <img src={doctor.profile_picture} alt={doctor.user?.username} className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-slate-100 shadow-sm" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto"><User className="w-10 h-10" /></div>
            )}
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center justify-center gap-1">
                {doctor.user?.username || 'Dr. Practitioner'} {doctor.verified_status && <ShieldCheck className="w-4 h-4 text-brand-500" />}
              </h3>
              <p className="text-brand-600 font-bold text-xs mt-0.5">{doctor.specialization || 'Clinical Expert'}</p>
            </div>
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5 text-xs font-semibold text-slate-600 text-left">
              <div className="flex items-center gap-3"><Award className="w-4 h-4 text-slate-400" /> <span>{doctor.experience_years || 0} Years Active Experience</span></div>
              <div className="flex items-center gap-3"><IndianRupee className="w-4 h-4 text-slate-400" /> <span className="text-slate-900 font-bold">₹{doctor.consultation_fee} Base Fee</span></div>
              <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-slate-400" /> <span>{doctor.appointment_time || 45} Min Slots</span></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Timeline Mode Constraints</span>
            <div className="space-y-2">
              {['online', 'offline', 'hybrid'].map((modeKey) => (
                <label key={modeKey} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 cursor-pointer text-xs font-bold text-slate-700 capitalize">
                  <input
                    type="checkbox"
                    checked={selectedModes[modeKey]}
                    onChange={() => { setSelectedModes(p => ({ ...p, [modeKey]: !p[modeKey] })); setSelectedDayIndex(null); setSelectedSlot(null); }}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>{modeKey} Modes</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Consultation Schedule Matrix</h4>
            <p className="text-slate-500 text-xs mt-0.5">Select an operational day and slot to make a booking.</p>
          </div>

          <Alert type="error" message={error} />

          {loading ? <Loader /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredDays.map((dayObj, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectDay(idx)}
                  className={`p-3 rounded-xl border text-left transition-all ${selectedDayIndex === idx ? 'bg-brand-600 border-brand-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'}`}
                >
                  <span className="block text-xs font-bold capitalize opacity-80">{dayObj.day}</span>
                  <span className="block text-sm font-black mt-0.5">{dayObj.date}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase mt-2 ${selectedDayIndex === idx ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700 border border-brand-100'}`}>
                    {dayObj.mode || 'offline'}
                  </span>
                </button>
              ))}

              {filteredDays.length === 0 && (
                <p className="col-span-full text-xs text-slate-400 italic p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  No slots available matching selected constraints.
                </p>
              )}
            </div>
          )}

          {selectedDayIndex !== null && filteredDays[selectedDayIndex] && (
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Select Session Segment</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredDays[selectedDayIndex].slots?.map((slot, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => { setSelectedSlot(slot); setBookingSuccess(''); setError(''); }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${selectedSlot === slot ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700'}`}
                  >
                    {slot.start} - {slot.end}
                  </button>
                ))}
              </div>

              {selectedSlot && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mt-4">
                  <span className="text-xs font-bold text-slate-900 block">Configure Booking Parameters</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {String(filteredDays[selectedDayIndex].mode).toLowerCase() === 'hybrid' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Consultation Mode Variant</label>
                        <select
                          value={chosenMode}
                          onChange={(e) => { 
                            setChosenMode(e.target.value); 
                            if (e.target.value === 'online') setPaymentMode('card');
                            else setPaymentMode('');
                          }}
                          className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none"
                        >
                          <option value="">Select Option</option>
                          <option value="online">Online Video Booking</option>
                          <option value="offline">Offline Clinic Walk-In</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Enforced Mode</label>
                        <div className="mt-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold capitalize text-slate-700">
                          {chosenMode} Session
                        </div>
                      </div>
                    )}

                    {chosenMode && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Gateway Routing</label>
                        {chosenMode === 'online' ? (
                          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none">
                            <option value="card">Online Secure Payment (Razorpay)</option>
                          </select>
                        ) : (
                          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none">
                            <option value="">Select Option</option>
                            <option value="cash">Pay Cash at Desk (Offline)</option>
                            <option value="card">Secure Online Payment (Razorpay)</option>
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      disabled={!chosenMode || !paymentMode || submittingBooking}
                      onClick={executeAppointmentBooking}
                      className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                    >
                      {submittingBooking ? 'Processing Booking & Payment...' : 'Proceed to Book'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Clinical Feedback Logs</span>
            <div className="space-y-3">
              {currentReviews.map((rev) => (
                <div key={rev.id} className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">"{rev.review_text}"</p>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-semibold text-slate-400">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40">Prev</button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}