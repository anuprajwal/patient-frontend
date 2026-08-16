
import React from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CheckupTimelineCard({ checkups }) {
  if (!checkups || checkups.length === 0) return null;

  return (
    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <h4 className="text-base font-extrabold text-emerald-950">
          Scheduled Checkup Consultations ({checkups.length})
        </h4>
      </div>

      <div className="space-y-3">
        {checkups.map((item, idx) => {
          const dateStr = item.checkup_date ? new Date(item.checkup_date).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
          }) : 'N/A';

          const isConfirmed = (item.checkup_status || '').toLowerCase() === 'confirmed';

          return (
            <div key={item.id || idx} className="bg-white border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Checkup Booking #{item.id}
                  </span>
                  {item.is_payment_required === false && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Free Consultation
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 text-xs font-bold text-slate-700 mt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" /> {dateStr}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {item.checkup_start_time} - {item.checkup_end_time}
                  </span>
                </div>
              </div>

              <div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                  isConfirmed 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isConfirmed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {item.checkup_status || 'Confirmed'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}