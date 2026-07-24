import React from 'react';
import { Search, Building2, Calendar, User, ArrowRight } from 'lucide-react';

export default function Dashboard({ setView }) {
  const cards = [
    { title: 'Search Specialists', desc: 'Find certified healthcare practitioners and view execution slot parameters.', action: 'doctors', icon: Search, color: 'bg-blue-500' },
    { title: 'Discover Hospitals', desc: 'Locate local clinics, treatment systems, and check physical operational profiles.', action: 'hospitals', icon: Building2, color: 'bg-indigo-500' },
    { title: 'Consultation Pipeline', desc: 'Track your pending medical bookings, active history records, and treatment updates.', action: 'appointments', icon: Calendar, color: 'bg-emerald-500' },
    { title: 'Identity & Compliance', desc: 'Update demographic constraints, manage multi-clinic addresses, and verify multi-step OTP credentials.', action: 'profile', icon: User, color: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome to your Care Panel</h1>
        <p className="text-slate-500 mt-2 text-base">Select an optimization parameter below to orchestrate your healthcare requirements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl text-white ${c.color} shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setView(c.action)}
                className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
              >
                Access Hub <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}