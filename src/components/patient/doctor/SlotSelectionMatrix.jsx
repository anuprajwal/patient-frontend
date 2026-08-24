import React from 'react';
import Loader from '../../../ui/Loader';

export default function SlotSelectionMatrix({
  loading,
  filteredDays,
  selectedDayIndex,
  selectedSlot,
  chosenMode,
  paymentMode,
  submittingBooking,
  onSelectDay,
  onSelectSlot,
  onChangeMode,
  onChangePaymentMode,
  onSubmitBooking
}) {
  return (
    <>
      <div>
        <h4 className="text-lg font-bold text-slate-900">Consultation Schedule Matrix</h4>
        <p className="text-slate-500 text-xs mt-0.5">Select an operational day and slot to make a booking.</p>
      </div>

      {loading ? <Loader /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredDays.map((dayObj, idx) => (
            <button
              key={idx}
              onClick={() => onSelectDay(idx)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedDayIndex === idx 
                  ? 'bg-brand-600 border-brand-600 text-white shadow-md' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <span className="block text-xs font-bold capitalize opacity-80">{dayObj.day}</span>
              <span className="block text-sm font-black mt-0.5">{dayObj.date}</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase mt-2 ${
                selectedDayIndex === idx 
                  ? 'bg-white/20 text-white' 
                  : 'bg-brand-50 text-brand-700 border border-brand-100'
              }`}>
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
                onClick={() => onSelectSlot(slot)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedSlot === slot 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700'
                }`}
              >
                {slot.start} - {slot.end}
              </button>
            ))}
          </div>

          {selectedSlot && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mt-4">
              <span className="text-xs font-bold text-slate-900 block">Configure Booking Parameters</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(!filteredDays[selectedDayIndex].mode || String(filteredDays[selectedDayIndex].mode).toLowerCase() === 'hybrid') ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Consultation Mode Variant</label>
                    <select
                      value={chosenMode}
                      onChange={(e) => onChangeMode(e.target.value)}
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
                      <select 
                        value={paymentMode} 
                        onChange={(e) => onChangePaymentMode(e.target.value)} 
                        className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none"
                      >
                        <option value="card">Online Secure Payment (Razorpay)</option>
                      </select>
                    ) : (
                      <select 
                        value={paymentMode} 
                        onChange={(e) => onChangePaymentMode(e.target.value)} 
                        className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none"
                      >
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
                  onClick={onSubmitBooking}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  {submittingBooking ? 'Processing Booking & Payment...' : 'Proceed to Book'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}