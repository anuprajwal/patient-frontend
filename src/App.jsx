// // src/App.jsx

// import React, { useState, useEffect } from 'react';
// import Navbar from './components/ui/Navbar';
// import Dashboard from './components/patient/Dashboard';
// import DoctorSearch from './components/patient/DoctorSearch';
// import DoctorDetails from './components/patient/DoctorDetails';
// import HospitalSearch from './components/patient/HospitalSearch';
// import AppointmentList from './components/patient/AppointmentList';
// import AppointmentDetails from './components/patient/AppointmentDetails';
// import HospitalDetails from './components/patient/HospitalDetails';
// import ProfileManagement from './components/patient/ProfileManagement';
// import { setAccountRestrictionHandler } from './services/api';
// import { ShieldAlert, ShieldX, LifeBuoy } from 'lucide-react';
// import { useNotificationToken } from './utils/useNotificationToken';

// // HERE THERE IS A CHANGE MADE: Active WebRTC Call Provider & Overlays
// import { CallProvider } from './context/CallContext';
// import IncomingCallModal from './components/calling/IncomingCallModal';
// import VideoCallModal from './components/calling/VideoCallModal';

// export default function App() {
//   // Initialize notification token hook
//   useNotificationToken();

//   const [view, setView] = useState('dashboard');
//   const [selectedDoctor, setSelectedDoctor] = useState(null);
//   const [selectedHospital, setSelectedHospital] = useState(null);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);

//   // State layout container for tracking account restrictions
//   const [restriction, setRestriction] = useState(null); // null | { status: 'holded' | 'deleted', message: string }

//   useEffect(() => {
//     // Bind the networking interceptor directly into the system state lifecycle
//     setAccountRestrictionHandler((restrictedState) => {
//       setRestriction(restrictedState);
//     });
//   }, []);

//   // Isolated interface rendered when an account restriction triggers
//   if (restriction) {
//     const isDeleted = restriction.status === 'deleted';
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
//         <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl p-8 text-center space-y-6">
//           <div className={`mx-auto p-4 rounded-2xl w-fit ${isDeleted ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
//             {isDeleted ? <ShieldX className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
//           </div>
          
//           <div className="space-y-2">
//             <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
//               {isDeleted ? 'Account Terminated' : 'Administrative Hold Active'}
//             </h1>
//             <p className="text-slate-600 text-sm leading-relaxed font-medium">
//               {restriction.message || 'Access limitations are currently enforced on this account.'}
//             </p>
//           </div>

//           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3 text-left">
//             <LifeBuoy className="w-5 h-5 text-slate-400 flex-shrink-0" />
//             <span className="text-xs text-slate-500 font-medium">
//               To appeal this status vector or request clinical profile recovery, please contact our institutional hardware helpdesk or email <strong className="text-slate-700">support@docapp.co.in</strong>.
//             </span>
//           </div>

//           <button 
//             onClick={() => {
//               document.cookie = "auth_token=; path=/; domain=.docapp.co.in; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
//               window.location.href = 'https://auth.docapp.co.in';
//             }}
//             className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-3 rounded-xl transition-colors shadow-sm"
//           >
//             Return to Login Gateway
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const renderActiveView = () => {
//     switch (view) {
//       case 'dashboard':
//         return <Dashboard setView={setView} />;
//       case 'doctors':
//         return (
//           <DoctorSearch
//             onSelectDoctor={(doc) => {
//               setSelectedDoctor(doc);
//               setView('doctor-details');
//             }}
//           />
//         );
//       case 'doctor-details':
//         return (
//           <DoctorDetails
//             doctor={selectedDoctor}
//             onBack={() => setView('doctors')}
//           />
//         );
//       case 'hospitals':
//         return (
//         <HospitalSearch
//             onSelectHospital={(hospital) => {
//               setSelectedHospital(hospital);
//               setView('hospital-details');
//             }}
//           />
//         );
//       case 'hospital-details':
//         return (
//           <HospitalDetails
//             hospital={selectedHospital}
//             onBack={() => setView('hospitals')}
//             onSelectDoctor={(doctor) => {
//               setSelectedDoctor(doctor);
//               setView('doctor-details');
//             }}
//           />
//         );
//       case 'appointments':
//         return (
//           <AppointmentList
//             onSelectAppointment={(app) => {
//               setSelectedAppointment(app);
//               setView('appointment-details');
//             }}
//           />
//         );
//       case 'appointment-details':
//         return (
//           <AppointmentDetails
//             appointment={selectedAppointment}
//             onBack={() => setView('appointments')}
//           />
//         );
//       case 'profile':
//         return <ProfileManagement />;
//       default:
//         return <Dashboard setView={setView} />;
//     }
//   };

//   return (
//     // HERE THERE IS A CHANGE MADE: Wrapped tree with CallProvider and mounted calling modals
//     <CallProvider>
//       <div className="min-h-screen bg-slate-50 flex flex-col">
//         <Navbar currentView={view} setView={setView} />
//         <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           {renderActiveView()}
//         </main>
//         {/* HERE THERE IS A CHANGE MADE: Modal overlays for incoming ringing and active video room */}
//         <IncomingCallModal />
//         <VideoCallModal />
//       </div>
//     </CallProvider>
//   );
// }

// src/App.jsx

import React, { useState, useEffect } from 'react';
import Navbar from './components/ui/Navbar';
import Dashboard from './components/patient/Dashboard';
import DoctorSearch from './components/patient/DoctorSearch';
import DoctorDetails from './components/patient/DoctorDetails';
import HospitalSearch from './components/patient/HospitalSearch';
import AppointmentList from './components/patient/AppointmentList';
import AppointmentDetails from './components/patient/AppointmentDetails';
import HospitalDetails from './components/patient/HospitalDetails';
import ProfileManagement from './components/patient/ProfileManagement';
import { setAccountRestrictionHandler } from './services/api';
import { ShieldAlert, ShieldX, LifeBuoy } from 'lucide-react';
import { useNotificationToken } from './utils/useNotificationToken';

import { CallProvider } from './context/CallContext';
import IncomingCallModal from './components/calling/IncomingCallModal';
import VideoCallModal from './components/calling/VideoCallModal';

export default function App() {
  useNotificationToken();

  // 1. Read initial view and selection parameters from the URL
  const getUrlState = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      view: params.get('tab') || 'dashboard',
      selectedDoctor: params.get('doctorId') ? { id: params.get('doctorId') } : null,
      selectedHospital: params.get('hospitalId') ? { id: params.get('hospitalId') } : null,
      selectedAppointment: params.get('appointmentId') ? { id: params.get('appointmentId') } : null,
    };
  };

  const initialUrlState = getUrlState();
  const [view, setView] = useState(initialUrlState.view);
  const [selectedDoctor, setSelectedDoctor] = useState(initialUrlState.selectedDoctor);
  const [selectedHospital, setSelectedHospital] = useState(initialUrlState.selectedHospital);
  const [selectedAppointment, setSelectedAppointment] = useState(initialUrlState.selectedAppointment);

  const [restriction, setRestriction] = useState(null);

  // 2. Helper to synchronize state changes directly to URL query params
  const navigateTo = (newView, data = {}) => {
    const params = new URLSearchParams();
    params.set('tab', newView);

    if (data.doctor) {
      params.set('doctorId', data.doctor.id || data.doctor);
      setSelectedDoctor(data.doctor);
    } else if (newView === 'doctors') {
      setSelectedDoctor(null);
    }

    if (data.hospital) {
      params.set('hospitalId', data.hospital.id || data.hospital);
      setSelectedHospital(data.hospital);
    } else if (newView === 'hospitals') {
      setSelectedHospital(null);
    }

    if (data.appointment) {
      params.set('appointmentId', data.appointment.id || data.appointment);
      setSelectedAppointment(data.appointment);
    } else if (newView === 'appointments') {
      setSelectedAppointment(null);
    }

    setView(newView);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  };

  // 3. Listen to browser Back/Forward navigation buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const state = getUrlState();
      setView(state.view);
      setSelectedDoctor(state.selectedDoctor);
      setSelectedHospital(state.selectedHospital);
      setSelectedAppointment(state.selectedAppointment);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    setAccountRestrictionHandler((restrictedState) => {
      setRestriction(restrictedState);
    });
  }, []);

  if (restriction) {
    const isDeleted = restriction.status === 'deleted';
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className={`mx-auto p-4 rounded-2xl w-fit ${isDeleted ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
            {isDeleted ? <ShieldX className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isDeleted ? 'Account Terminated' : 'Administrative Hold Active'}
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {restriction.message || 'Access limitations are currently enforced on this account.'}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3 text-left">
            <LifeBuoy className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-500 font-medium">
              To appeal this status vector or request clinical profile recovery, please contact our institutional hardware helpdesk or email <strong className="text-slate-700">support@docapp.co.in</strong>.
            </span>
          </div>

          <button 
            onClick={() => {
              document.cookie = "auth_token=; path=/; domain=.docapp.co.in; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
              window.location.href = 'https://auth.docapp.co.in';
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            Return to Login Gateway
          </button>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard setView={(tab) => navigateTo(tab)} />;
      case 'doctors':
        return (
          <DoctorSearch
            onSelectDoctor={(doc) => navigateTo('doctor-details', { doctor: doc })}
          />
        );
      case 'doctor-details':
        return (
          <DoctorDetails
            doctor={selectedDoctor}
            onBack={() => navigateTo('doctors')}
          />
        );
      case 'hospitals':
        return (
          <HospitalSearch
            onSelectHospital={(hospital) => navigateTo('hospital-details', { hospital })}
          />
        );
      case 'hospital-details':
        return (
          <HospitalDetails
            hospital={selectedHospital}
            onBack={() => navigateTo('hospitals')}
            onSelectDoctor={(doctor) => navigateTo('doctor-details', { doctor })}
          />
        );
      case 'appointments':
        return (
          <AppointmentList
            onSelectAppointment={(app) => navigateTo('appointment-details', { appointment: app })}
          />
        );
      case 'appointment-details':
        return (
          <AppointmentDetails
            appointment={selectedAppointment}
            onBack={() => navigateTo('appointments')}
          />
        );
      case 'profile':
        return <ProfileManagement />;
      default:
        return <Dashboard setView={(tab) => navigateTo(tab)} />;
    }
  };

  return (
    <CallProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar currentView={view} setView={(tab) => navigateTo(tab)} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderActiveView()}
        </main>
        <IncomingCallModal />
        <VideoCallModal />
      </div>
    </CallProvider>
  );
}