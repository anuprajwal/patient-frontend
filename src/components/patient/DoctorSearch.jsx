// import React, { useState, useEffect } from 'react';
// import { patientEndpoints } from '../../services/api';
// import Loader from '../ui/Loader';
// import Alert from '../ui/Alert';
// import { Search, User, MapPin, Award, IndianRupee, ArrowRight } from 'lucide-react';

// export default function DoctorSearch({ onSelectDoctor }) {
//   const [specialization, setSpecialization] = useState('');
//   const [doctors, setDoctors] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const specialties = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'General Physician'];

//   const fetchDoctors = async (specValue = '') => {
//     setLoading(true);
//     setError('');
//     try {
//       const response = await patientEndpoints.filterDoctors(specValue);
//       if (response.data?.success) {
//         setDoctors(response.data.doctors || []);
//       } else {
//         setDoctors([]);
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to search doctors portfolio matrix.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDoctors();
//   }, []);

//   const handleSearchSubmit = (e) => {
//     e.preventDefault();
//     fetchDoctors(specialization);
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-900">Search Specialists Portfolio</h2>
//           <p className="text-slate-500 text-sm">Query certified medical experts matching clinical metrics.</p>
//         </div>
//       </div>

//       <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
//         <div className="flex-1 relative">
//           <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//           <select
//             value={specialization}
//             onChange={(e) => setSpecialization(e.target.value)}
//             className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
//           >
//             <option value="">All Specializations</option>
//             {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
//           </select>
//         </div>
//         <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-sm">
//           Execute Filter
//         </button>
//       </form>

//       <Alert type="error" message={error} />

//       {loading ? <Loader /> : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {doctors.map((doc) => (
//             <div 
//               key={doc.id} 
//               onClick={() => onSelectDoctor(doc)}
//               className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between"
//             >
//               <div className="p-5 space-y-4">
//                 <div className="flex items-center gap-4">
//                   {doc.profile_picture ? (
//                     <img src={doc.profile_picture} alt={doc.user?.username} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
//                   ) : (
//                     <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-6 h-6" /></div>
//                   )}
//                   <div>
//                     <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base">{doc.user?.username || 'Practitioner Record'}</h4>
//                     <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-semibold mt-0.5">{doc.specialization}</span>
//                   </div>
//                 </div>

//                 <div className="space-y-2 pt-2 text-sm text-slate-600">
//                   <div className="flex items-center gap-2"><Award className="w-4 h-4 text-slate-400" /> <span>{doc.experience_years} Years Active Practice</span></div>
//                   <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-slate-400" /> <span className="font-medium text-slate-800">₹{doc.consultation_fee} Base Tariff</span></div>
//                   {doc.user?.address?.[0] && (
//                     <div className="flex items-start gap-2 text-xs text-slate-500">
//                       <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
//                       <span>{doc.user.address[0].street}, {doc.user.address[0].city}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//               <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:bg-brand-50 transition-colors">
//                 View Availability Slots <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
//               </div>
//             </div>
//           ))}

//           {!loading && doctors.length === 0 && (
//             <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
//               No medical experts discovered matching criteria parameters.
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { Search, User, Award, IndianRupee, ArrowRight, Filter } from 'lucide-react';

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
    try {
      let response;
      if (searchName.trim() !== '') {
        // Fallback simulator routing for searching practitioners by name [cite: 44, 45]
        response = await patientEndpoints.searchDoctorsByName(searchName);
      } else {
        response = await patientEndpoints.filterDoctors(specialization);
      }
      
      if (response.data?.success || Array.isArray(response.data?.doctors)) {
        setDoctors(response.data.doctors || response.data || []);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      // Graceful local directory error processing to preserve execution flows
      setError('Query returned exception. Displaying current local records match index.');
      const localResponse = await patientEndpoints.filterDoctors('');
      setDoctors(localResponse.data?.doctors || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [specialization]); // Re-queries automatically when the drop-down option updates

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Search Specialists Portfolio</h2>
        <p className="text-slate-500 text-sm">Query certified medical experts matching clinical metrics.</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Writable User Input Form Block  */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Type doctor's name to search..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Separated Option Parameter Drop-down  */}
        <div className="w-full md:w-64 relative">
          <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={specialization}
            onChange={(e) => {
              setSearchName(''); // Clears name scope to allow specialization logic parsing
              setSpecialization(e.target.value);
            }}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div 
              key={doc.id} 
              onClick={() => onSelectDoctor(doc)}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  {doc.profile_picture ? (
                    <img src={doc.profile_picture} alt={doc.user?.username} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-6 h-6" /></div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base">{doc.user?.username || 'Practitioner Record'}</h4>
                    <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-semibold mt-0.5">{doc.specialization || 'General'}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Award className="w-4 h-4 text-slate-400" /> <span>{doc.experience_years || 0} Years Active Practice</span></div>
                  <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-slate-400" /> <span className="font-medium text-slate-800">₹{doc.consultation_fee} Base Tariff</span></div>
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:bg-brand-50 transition-colors">
                View Availability Slots <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}

          {!loading && doctors.length === 0 && (
            <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              No medical experts discovered matching criteria parameters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}