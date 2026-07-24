// import React, { useState, useEffect } from 'react';
// import { patientEndpoints } from '../../services/api';
// import Loader from '../ui/Loader';
// import Alert from '../ui/Alert';
// import { ArrowLeft, User, Award, IndianRupee, Clock, Video, Home, Calendar } from 'lucide-react';

// export default function DoctorDetails({ doctor, onBack }) {
//   const [slotsData, setSlotsData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [selectedDayIndex, setSelectedDayIndex] = useState(null);

//   useEffect(() => {
//     const fetchSlots = async () => {
//       setLoading(true);
//       setError('');
//       try {
//         const response = await patientEndpoints.showDoctorSlots(doctor.user_id || doctor.id);
        
//         // Handles standalone payload formatting structure cleanly [cite: 36]
//         let baseSlotsElement = null;
//         if (response.data?.slots && Array.isArray(response.data.slots) && response.data.slots[0]) {
//           baseSlotsElement = response.data.slots[0].slots; // Targets inner string map matrix [cite: 36, 37]
//         } else {
//           baseSlotsElement = response.data?.slots || doctor.user?.doctorSlots?.slots;
//         }

//         if (typeof baseSlotsElement === 'string') {
//           setSlotsData(JSON.parse(baseSlotsElement));
//         } else if (Array.isArray(baseSlotsElement)) {
//           setSlotsData(baseSlotsElement);
//         } else {
//           setSlotsData([]);
//         }
//       } catch (err) {
//         setError('Failed to sync active reservation slots matrix timeline.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (doctor) fetchSlots();
//   }, [doctor]);

//   return (
//     <div className="space-y-6">
//       <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
//         <ArrowLeft className="w-4 h-4" /> Return to Directory
//       </button>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center space-y-4 h-fit">
//           {doctor.profile_picture ? (
//             <img src={doctor.profile_picture} alt={doctor.user?.username} className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-slate-50 shadow-sm" />
//           ) : (
//             <div className="w-28 h-28 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto"><User className="w-12 h-12" /></div>
//           )}
//           <div>
//             <h3 className="text-xl font-bold text-slate-900">{doctor.user?.username || 'Dr. Practitioner'}</h3>
//             <p className="text-brand-600 font-semibold text-sm mt-0.5">{doctor.specialization}</p>
//           </div>
//           <div className="border-t border-slate-100 pt-4 flex flex-col gap-3 text-sm text-slate-600 text-left">
//             <div className="flex items-center gap-3"><Award className="w-5 h-5 text-slate-400" /> <span>{doctor.experience_years} Years Experience</span></div>
//             <div className="flex items-center gap-3"><IndianRupee className="w-5 h-5 text-slate-400" /> <span className="font-bold text-slate-800">₹{doctor.consultation_fee} Fee</span></div>
//             <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-slate-400" /> <span>{doctor.appointment_time || 45} min Session Blocks</span></div>
//           </div>
//         </div>

//         <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
//           <div>
//             <h4 className="text-lg font-bold text-slate-900">Consultation Schedule Matrix</h4>
//             <p className="text-slate-500 text-xs mt-0.5">Select a practice calendar day vector below to reveal diagnostic execution windows.</p>
//           </div>

//           <Alert type="error" message={error} />

//           {loading ? <Loader /> : (
//             <div className="space-y-6">
//               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
//                 {slotsData.map((dayObj, idx) => {
//                   const hasSlots = dayObj.slots && dayObj.slots.length > 0;
//                   return (
//                     <button
//                       key={idx}
//                       onClick={() => setSelectedDayIndex(idx)}
//                       className={`p-3 rounded-lg border text-left transition-all ${
//                         selectedDayIndex === idx 
//                           ? 'bg-brand-600 border-brand-600 text-white shadow-sm' 
//                           : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
//                       }`}
//                     >
//                       <span className="block text-xs font-semibold capitalize opacity-75">{dayObj.day}</span>
//                       <span className="block text-sm font-bold mt-0.5">{dayObj.date}</span>
//                       {dayObj.mode && (
//                         <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase mt-2 ${
//                           selectedDayIndex === idx ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
//                         }`}>
//                           {dayObj.mode === 'online' ? <Video className="w-2.5 h-2.5" /> : <Home className="w-2.5 h-2.5" />} {dayObj.mode}
//                         </span>
//                       )}
//                     </button>
//                   );
//                 })}
//               </div>

//               {selectedDayIndex !== null && slotsData[selectedDayIndex] && (
//                 <div className="border-t border-slate-100 pt-6 space-y-3">
//                   <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
//                     <Calendar className="w-4 h-4 text-slate-400" /> Available Workstation Windows ({slotsData[selectedDayIndex].date})
//                   </h5>
//                   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
//                     {slotsData[selectedDayIndex].slots?.map((slot, sIdx) => (
//                       <button key={sIdx} className="border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-xs font-bold p-2.5 rounded-lg text-center transition-all shadow-sm">
//                         {slot.start} - {slot.end}
//                       </button>
//                     ))}
//                   </div>
//                   {(!slotsData[selectedDayIndex].slots || slotsData[selectedDayIndex].slots.length === 0) && (
//                     <p className="text-slate-400 text-xs italic">No operational consultation hours provided for this target calendar vector.</p>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { ArrowLeft, User, Award, IndianRupee, Clock, Video, Home, Calendar } from 'lucide-react';

export default function DoctorDetails({ doctor, onBack }) {
  const [slotsData, setSlotsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await patientEndpoints.showDoctorSlots(doctor.user_id || doctor.id);
        
        let targetSlotsBlock = null;
        // Ingest array node tracking based on incoming explicit data mapping structures
        if (response.data?.slots && Array.isArray(response.data.slots) && response.data.slots[0]) {
          targetSlotsBlock = response.data.slots[0].slots; 
        } else {
          targetSlotsBlock = response.data?.slots || doctor.user?.doctorSlots?.slots;
        }

        if (typeof targetSlotsBlock === 'string') {
          setSlotsData(JSON.parse(targetSlotsBlock));
        } else if (Array.isArray(targetSlotsBlock)) {
          setSlotsData(targetSlotsBlock);
        } else {
          setSlotsData([]);
        }
      } catch (err) {
        setError('Failed to sync active reservation slots matrix timeline.');
      } finally {
        setLoading(false);
      }
    };
    if (doctor) fetchSlots();
  }, [doctor]);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" /> Return to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center space-y-4 h-fit">
          {doctor.profile_picture ? (
            <img src={doctor.profile_picture} alt={doctor.user?.username} className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-slate-50 shadow-sm" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto"><User className="w-12 h-12" /></div>
          )}
          <div>
            <h3 className="text-xl font-bold text-slate-900">{doctor.user?.username || 'Dr. Practitioner'}</h3>
            <p className="text-brand-600 font-semibold text-sm mt-0.5">{doctor.specialization}</p>
          </div>
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3 text-sm text-slate-600 text-left">
            <div className="flex items-center gap-3"><Award className="w-5 h-5 text-slate-400" /> <span>{doctor.experience_years || 0} Years Experience</span></div>
            <div className="flex items-center gap-3"><IndianRupee className="w-5 h-5 text-slate-400" /> <span className="font-bold text-slate-800">₹{doctor.consultation_fee} Fee</span></div>
            <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-slate-400" /> <span>{doctor.appointment_time || 45} min Session Blocks</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Consultation Schedule Matrix</h4>
            <p className="text-slate-500 text-xs mt-0.5">Select an active timeline node block item below to see exact consultation hour breakdowns.</p>
          </div>

          <Alert type="error" message={error} />

          {loading ? <Loader /> : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slotsData.map((dayObj, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedDayIndex === idx 
                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="block text-xs font-semibold capitalize opacity-75">{dayObj.day}</span>
                    <span className="block text-sm font-bold mt-0.5">{dayObj.date}</span>
                    {dayObj.mode && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase mt-2 ${
                        selectedDayIndex === idx ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
                      }`}>
                        {dayObj.mode === 'online' ? <Video className="w-2.5 h-2.5" /> : <Home className="w-2.5 h-2.5" />} {dayObj.mode}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {selectedDayIndex !== null && slotsData[selectedDayIndex] && (
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> Available Workstation Windows ({slotsData[selectedDayIndex].date})
                  </h5>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {slotsData[selectedDayIndex].slots?.map((slot, sIdx) => (
                      <button key={sIdx} className="border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-xs font-bold p-2.5 rounded-lg text-center transition-all shadow-sm">
                        {slot.start} - {slot.end}
                      </button>
                    ))}
                  </div>
                  {(!slotsData[selectedDayIndex].slots || slotsData[selectedDayIndex].slots.length === 0) && (
                    <p className="text-slate-400 text-xs italic">No operational consultation hours provided for this target calendar vector.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}