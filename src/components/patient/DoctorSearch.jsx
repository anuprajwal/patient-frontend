// import React, { useState, useEffect } from 'react';
// import { patientEndpoints } from '../../services/api';
// import Loader from '../ui/Loader';
// import Alert from '../ui/Alert';
// import { Search, User, Award, IndianRupee, ArrowRight, Filter, MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';

// export default function DoctorSearch({ onSelectDoctor }) {
//   const [searchName, setSearchName] = useState('');
//   const [specialization, setSpecialization] = useState('');
//   const [doctors, setDoctors] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const specialties = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'General Physician'];

//   const executeSearch = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       let response;
//       if (searchName.trim() !== '') {
//         response = await patientEndpoints.searchDoctorsByName(searchName);
//       } else {
//         response = await patientEndpoints.filterDoctors(specialization);
//       }
      
//       if (response.data?.success || Array.isArray(response.data?.doctors)) {
//         setDoctors(response.data.doctors || response.data || []);
//       } else {
//         setDoctors([]);
//       }
//     } catch (err) {
//       setError('Directory query returned exception. Pulling latest active clinical ledger.');
//       const fallback = await patientEndpoints.filterDoctors('');
//       setDoctors(fallback.data?.doctors || []);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { executeSearch(); }, [specialization]);

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-2xl font-bold text-slate-900">Search Specialists Portfolio</h2>
//         <p className="text-slate-500 text-sm">Query certified medical experts matching real-time clinic status variables.</p>
//       </div>

//       <form onSubmit={(e) => { e.preventDefault(); executeSearch(); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
//         <div className="flex-1 relative">
//           <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//           <input
//             type="text"
//             value={searchName}
//             onChange={(e) => setSearchName(e.target.value)}
//             placeholder="Type doctor's name to look up..."
//             className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
//           />
//         </div>

//         <div className="w-full md:w-64 relative">
//           <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//           <select
//             value={specialization}
//             onChange={(e) => { setSearchName(''); setSpecialization(e.target.value); }}
//             className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
//           >
//             <option value="">All Specializations</option>
//             {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
//           </select>
//         </div>

//         <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-sm">
//           Execute Query
//         </button>
//       </form>

//       <Alert type="success" message={error ? error : null} />

//       {loading ? <Loader /> : (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {doctors.map((doc) => {
//             // Direct extraction of nested variables from array list
//             const addressObj = doc.user?.address?.[0];
//             return (
//               <div 
//                 key={doc.id} 
//                 onClick={() => onSelectDoctor(doc)}
//                 className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
//               >
//                 <div className="p-6 space-y-4">
//                   <div className="flex items-start justify-between gap-4">
//                     <div className="flex gap-4">
//                       {doc.profile_picture ? (
//                         <img src={doc.profile_picture} alt={doc.user?.username} className="w-16 h-14 rounded-xl object-cover border border-slate-100" />
//                       ) : (
//                         <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-6 h-6" /></div>
//                       )}
//                       <div>
//                         <div className="flex items-center gap-1.5">
//                           <h4 className="font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors text-base">{doc.user?.username || 'Practitioner'}</h4>
//                           {doc.verified_status && <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />}
//                         </div>
//                         <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs bg-brand-50 text-brand-700 font-bold mt-1">
//                           {doc.specialization || 'General Practice'}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Base Tariff</span>
//                       <p className="text-lg font-black text-slate-900 flex items-center justify-end mt-0.5"><IndianRupee className="w-4 h-4" />{doc.consultation_fee || '500.00'}</p>
//                     </div>
//                   </div>

//                   {/* Enhanced Parameter Layout Data Grids */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-medium text-slate-600 border-t border-slate-100">
//                     <div className="space-y-2">
//                       <div className="flex items-center gap-2"><Award className="w-4 h-4 text-slate-400" /> <span>{doc.experience_years || '0'} Years Experience</span></div>
//                       <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> <span className="truncate">{doc.user?.email}</span></div>
//                       <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> <span>{doc.user?.phone_number}</span></div>
//                     </div>

//                     <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
//                       <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Clinical Setting Location</span>
//                       {addressObj ? (
//                         <p className="text-slate-600 leading-tight flex items-start gap-1">
//                           <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
//                           <span>{addressObj.house_no ? `${addressObj.house_no}, ` : ''}{addressObj.street}, {addressObj.city}, {addressObj.state} - <strong>{addressObj.pincode}</strong></span>
//                         </p>
//                       ) : (
//                         <span className="text-slate-400 italic text-[11px]">No address specified</span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600 group-hover:bg-brand-50 transition-colors">
//                   Check Schedule & View Availability Slots <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { Search, User, Award, IndianRupee, ArrowRight, Filter, MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function DoctorSearch({ onSelectDoctor }) {
  const [searchName, setSearchName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const specialties = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'General Physician'];

  const executeSearch = async () => {
    setLoading(true);
    setError('');
    console.log('🔍 [DEBUG DoctorSearch] Executing doctor search query...');
    try {
      let response;
      if (searchName.trim() !== '') {
        console.log('📡 [DEBUG DoctorSearch] Searching by name:', searchName);
        response = await patientEndpoints.searchDoctorsByName(searchName);
      } else {
        console.log('📡 [DEBUG DoctorSearch] Filtering by specialization:', specialization);
        response = await patientEndpoints.filterDoctors(specialization);
      }
      
      console.log('📩 [DEBUG DoctorSearch] Raw response received:', response);

      if (response.data?.success || Array.isArray(response.data?.doctors)) {
        const fetchedDocs = response.data.doctors || response.data || [];
        console.log('📊 [DEBUG DoctorSearch] Doctors found count:', fetchedDocs.length);
        console.log('📊 [DEBUG DoctorSearch] Doctors list sample:', fetchedDocs[0]);
        setDoctors(fetchedDocs);
      } else {
        console.warn('⚠️ [DEBUG DoctorSearch] Unrecognized response format, defaulting to empty list.');
        setDoctors([]);
      }
    } catch (err) {
      console.error('❌ [DEBUG DoctorSearch] Query failed, using fallback:', err);
      setError('Directory query returned exception. Pulling latest active clinical ledger.');
      const fallback = await patientEndpoints.filterDoctors('');
      setDoctors(fallback.data?.doctors || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { executeSearch(); }, [specialization]);

  const handleCardClick = (doc) => {
    console.log('👉 [DEBUG DoctorSearch] Doctor card clicked:', doc);
    if (onSelectDoctor) {
      onSelectDoctor(doc);
    } else {
      console.warn('⚠️ [DEBUG DoctorSearch] onSelectDoctor prop is missing or not a function!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Search Specialists Portfolio</h2>
        <p className="text-slate-500 text-sm">Query certified medical experts matching real-time clinic status variables.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); executeSearch(); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Type doctor's name to look up..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="w-full md:w-64 relative">
          <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={specialization}
            onChange={(e) => { setSearchName(''); setSpecialization(e.target.value); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
          >
            <option value="">All Specializations</option>
            {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-sm">
          Execute Query
        </button>
      </form>

      <Alert type="success" message={error ? error : null} />

      {loading ? <Loader /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {doctors.map((doc) => {
            const addressObj = doc.user?.address?.[0];
            return (
              <div 
                key={doc.id} 
                onClick={() => handleCardClick(doc)}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      {doc.profile_picture ? (
                        <img src={doc.profile_picture} alt={doc.user?.username} className="w-16 h-14 rounded-xl object-cover border border-slate-100" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-6 h-6" /></div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors text-base">{doc.user?.username || 'Practitioner'}</h4>
                          {doc.verified_status && <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />}
                        </div>
                        <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs bg-brand-50 text-brand-700 font-bold mt-1">
                          {doc.specialization || 'General Practice'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Base Tariff</span>
                      <p className="text-lg font-black text-slate-900 flex items-center justify-end mt-0.5"><IndianRupee className="w-4 h-4" />{doc.consultation_fee || '500.00'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-medium text-slate-600 border-t border-slate-100">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2"><Award className="w-4 h-4 text-slate-400" /> <span>{doc.experience_years || '0'} Years Experience</span></div>
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> <span className="truncate">{doc.user?.email}</span></div>
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> <span>{doc.user?.phone_number}</span></div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Clinical Setting Location</span>
                      {addressObj ? (
                        <p className="text-slate-600 leading-tight flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                          <span>{addressObj.house_no ? `${addressObj.house_no}, ` : ''}{addressObj.street}, {addressObj.city}, {addressObj.state} - <strong>{addressObj.pincode}</strong></span>
                        </p>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No address specified</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600 group-hover:bg-brand-50 transition-colors">
                  Check Schedule & View Availability Slots <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}