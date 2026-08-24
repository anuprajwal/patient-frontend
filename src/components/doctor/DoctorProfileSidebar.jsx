import React from 'react';
import { User, Award, IndianRupee, Clock, ShieldCheck } from 'lucide-react';

const calculateDoctorExperience = (practiceStartDate, legacyYears) => {
  if (practiceStartDate) {
    const [startYear, startMonth] = practiceStartDate.slice(0, 7).split('-').map(Number);
    if (startYear && startMonth) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const totalMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth);
      if (totalMonths < 0) return 'Practice starts soon';

      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;

      const yearStr = years > 0 ? `${years} ${years === 1 ? 'Year' : 'Years'}` : '';
      const monthStr = months > 0 ? `${months} ${months === 1 ? 'Month' : 'Months'}` : '';

      if (yearStr && monthStr) return `${yearStr}, ${monthStr} Active Experience`;
      if (yearStr) return `${yearStr} Active Experience`;
      if (monthStr) return `${monthStr} Active Experience`;
      return '< 1 Month Active Experience';
    }
  }

  if (legacyYears) {
    return `${legacyYears} ${Number(legacyYears) === 1 ? 'Year' : 'Years'} Active Experience`;
  }

  return 'Practitioner';
};

export default function DoctorProfileSidebar({ doctor, selectedModes, onToggleMode }) {
  const practiceStartDate = doctor?.practice_start_date || doctor?.doctorProfile?.practice_start_date;
  const legacyExperienceYears = doctor?.experience_years || doctor?.doctorProfile?.experience_years;
  const experienceLabel = calculateDoctorExperience(practiceStartDate, legacyExperienceYears);

  const profilePic = doctor?.profile_picture || doctor?.doctorProfile?.profile_picture;
  const username = doctor?.user?.username || doctor?.username || 'Dr. Practitioner';
  const isVerified = Boolean(doctor?.verified_status || doctor?.doctorProfile?.verified_status);
  const specialization = doctor?.specialization || doctor?.doctorProfile?.specialization || 'Clinical Expert';
  const fee = doctor?.consultation_fee || doctor?.doctorProfile?.consultation_fee || 0;
  const slotDuration = doctor?.appointment_time || doctor?.doctorProfile?.appointment_time || 45;

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
        {profilePic ? (
          <img 
            src={profilePic} 
            alt={username} 
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-slate-100 shadow-sm" 
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto">
            <User className="w-10 h-10" />
          </div>
        )}

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center justify-center gap-1">
            {username} {isVerified && <ShieldCheck className="w-4 h-4 text-brand-500" />}
          </h3>
          <p className="text-brand-600 font-bold text-xs mt-0.5">{specialization}</p>
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5 text-xs font-semibold text-slate-600 text-left">
          <div className="flex items-center gap-3">
            <Award className="w-4 h-4 text-slate-400" /> 
            <span>{experienceLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <IndianRupee className="w-4 h-4 text-slate-400" /> 
            <span className="text-slate-900 font-bold">₹{fee} Base Fee</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-400" /> 
            <span>{slotDuration} Min Slots</span>
          </div>
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
                onChange={() => onToggleMode(modeKey)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>{modeKey} Modes</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}