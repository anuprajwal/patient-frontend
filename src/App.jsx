import React, { useState, useEffect } from 'react';
import Navbar from './components/ui/Navbar';
import Dashboard from './components/patient/Dashboard';
import DoctorSearch from './components/patient/DoctorSearch';
import DoctorDetails from './components/patient/DoctorDetails';
import HospitalSearch from './components/patient/HospitalSearch';
import HospitalDetails from './components/patient/HospitalDetails';
import AppointmentList from './components/patient/AppointmentList';
import AppointmentDetails from './components/patient/AppointmentDetails';
import ProfileManagement from './components/patient/ProfileManagement';
import { setAccountRestrictionHandler } from './services/api';
import { ShieldAlert, ShieldX, LifeBuoy } from 'lucide-react';
import { useNotificationToken } from './utils/useNotificationToken';

import { CallProvider } from './context/CallContext';
import IncomingCallModal from './components/calling/IncomingCallModal';
import VideoCallModal from './components/calling/VideoCallModal';

// Storage helpers to persist full entity objects
const getCachedEntity = (key, id) => {
  try {
    const raw = sessionStorage.getItem(`cached_${key}`);
    if (!raw) return id ? { id } : null;
    const parsed = JSON.parse(raw);
    const parsedId = String(parsed.id || parsed.user_id || parsed.targetId || '');
    // If the cached object ID matches the URL param ID, use the cached object
    if (id && parsedId && parsedId !== String(id)) {
      return { id };
    }
    return parsed;
  } catch (e) {
    return id ? { id } : null;
  }
};

const setCachedEntity = (key, data) => {
  if (data && typeof data === 'object') {
    sessionStorage.setItem(`cached_${key}`, JSON.stringify(data));
  } else {
    sessionStorage.removeItem(`cached_${key}`);
  }
};

export default function App() {
  useNotificationToken();

  // 1. Read initial view and full objects from URL + SessionStorage
  const getUrlState = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'dashboard';
    const doctorId = params.get('doctorId');
    const hospitalId = params.get('hospitalId');
    const appointmentId = params.get('appointmentId');

    return {
      view: tab,
      selectedDoctor: doctorId ? getCachedEntity('doctor', doctorId) : null,
      selectedHospital: hospitalId ? getCachedEntity('hospital', hospitalId) : null,
      selectedAppointment: appointmentId ? getCachedEntity('appointment', appointmentId) : null,
    };
  };

  const initialUrlState = getUrlState();
  const [view, setView] = useState(initialUrlState.view);
  const [selectedDoctor, setSelectedDoctor] = useState(initialUrlState.selectedDoctor);
  const [selectedHospital, setSelectedHospital] = useState(initialUrlState.selectedHospital);
  const [selectedAppointment, setSelectedAppointment] = useState(initialUrlState.selectedAppointment);

  const [restriction, setRestriction] = useState(null);

  // 2. Synchronize navigation state with URL query parameters and SessionStorage
  const navigateTo = (newView, data = {}) => {
    const params = new URLSearchParams();
    params.set('tab', newView);

    // Doctor Navigation
    if (data.doctor) {
      const docId = data.doctor.user_id || data.doctor.id || data.doctor.targetId || data.doctor;
      params.set('doctorId', docId);
      setSelectedDoctor(data.doctor);
      setCachedEntity('doctor', data.doctor);
    } else if (newView === 'doctors' || newView === 'dashboard') {
      setSelectedDoctor(null);
      setCachedEntity('doctor', null);
    }

    // Hospital Navigation
    if (data.hospital) {
      const hospId = data.hospital.user_id || data.hospital.id || data.hospital.targetId || data.hospital;
      params.set('hospitalId', hospId);
      setSelectedHospital(data.hospital);
      setCachedEntity('hospital', data.hospital);
    } else if (newView === 'hospitals' || newView === 'dashboard') {
      setSelectedHospital(null);
      setCachedEntity('hospital', null);
    }

    // Appointment Navigation
    if (data.appointment) {
      const appId = data.appointment.id || data.appointment;
      params.set('appointmentId', appId);
      setSelectedAppointment(data.appointment);
      setCachedEntity('appointment', data.appointment);
    } else if (newView === 'appointments' || newView === 'dashboard') {
      setSelectedAppointment(null);
      setCachedEntity('appointment', null);
    }

    setView(newView);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  };

  // 3. Listen to browser Back/Forward navigation (popstate)
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
              To appeal this status vector or request clinical profile recovery, please contact helpdesk or email <strong className="text-slate-700">support@docapp.co.in</strong>.
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