import React from 'react';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';

export default function DoctorSlotPicker({
  loading,
  error,
  filteredDays,
  selectedDayIndex,
  onSelectDay,
  selectedSlot,
  onSelectSlot,
  selectedModes,
  onToggleMode,
  chosenMode,
  onChangeChosenMode,
  paymentMode,
  onChangePaymentMode,
  onProceed,
  submitting,
  submitButtonText = "Proceed to Book",
  isCheckup = false
}) {
  const activeDay = selectedDayIndex !== null ? filteredDays[selectedDayIndex] : null;

  return (
    <div className="space-y-6">
      {/* Mode Constraints */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
          Filter Consultation Modes
        </span>
        <div className="flex flex-wrap gap-3">
          {['online', 'offline', 'hybrid'].map((modeKey) => (
            <label key={modeKey} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer text-xs font-bold text-slate-700 capitalize">
              <input
                type="checkbox"
                checked={selectedModes[modeKey]}
                onChange={() => onToggleMode(modeKey)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>{modeKey}</span>
            </label>
          ))}
        </div>
      </div>

      <Alert type="error" message={error} />

      {loading ? <Loader /> : (
        <div className="space-y-4">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Available Dates</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredDays.map((dayObj, idx) => (
              <button
                key={idx}
                type="button"
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
                  selectedDayIndex === idx ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700 border border-brand-100'
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
        </div>
      )}

      {/* Slots Segment */}
      {activeDay && (
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Select Session Slot</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {activeDay.slots?.map((slot, sIdx) => {
              const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
              return (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700'
                  }`}
                >
                  {slot.start} - {slot.end}
                </button>
              );
            })}
          </div>

          {selectedSlot && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mt-4">
              <span className="text-xs font-bold text-slate-900 block">Configure Booking Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {String(activeDay.mode).toLowerCase() === 'hybrid' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Consultation Mode</label>
                    <select
                      value={chosenMode}
                      onChange={(e) => onChangeChosenMode(e.target.value)}
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Routing</label>
                    {chosenMode === 'online' ? (
                      <select 
                        value={paymentMode || 'card'} 
                        onChange={(e) => onChangePaymentMode(e.target.value)} 
                        className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none"
                      >
                        <option value="card">Online Secure Payment (Razorpay / Card)</option>
                      </select>
                    ) : (
                      <select 
                        value={paymentMode} 
                        onChange={(e) => onChangePaymentMode(e.target.value)} 
                        className="mt-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none"
                      >
                        <option value="">Select Payment Option</option>
                        <option value="cash">Pay Cash at Desk (Offline)</option>
                        <option value="mobile_banking">Mobile Banking</option>
                        <option value="card">Online Secure Payment (Razorpay)</option>
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!chosenMode || submitting}
                  onClick={onProceed}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  {submitting ? 'Processing Checkup...' : submitButtonText}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}