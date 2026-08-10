import React, { useState, useEffect } from 'react';
import Navbar from './components/ui/Navbar';
import Dashboard from './components/patient/Dashboard';
import DoctorSearch from './components/patient/DoctorSearch';
import DoctorDetails from './components/patient/DoctorDetails';
import HospitalSearch from './components/patient/HospitalSearch';
import AppointmentList from './components/patient/AppointmentList';
import AppointmentDetails from './components/patient/AppointmentDetails';
import ProfileManagement from './components/patient/ProfileManagement';
import { setAccountRestrictionHandler } from './services/api';
import { ShieldAlert, ShieldX, LifeBuoy } from 'lucide-react';
import { useNotificationToken } from './utils/useNotificationToken';

export default function App() {
  // Initialize notification token hook
  useNotificationToken();

  const [view, setView] = useState('dashboard');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // State layout container for tracking account restrictions
  const [restriction, setRestriction] = useState(null); // null | { status: 'holded' | 'deleted', message: string }

  useEffect(() => {
    // Bind the networking interceptor directly into the system state lifecycle
    setAccountRestrictionHandler((restrictedState) => {
      setRestriction(restrictedState);
    });
  }, []);

  // Isolated interface rendered when an account restriction triggers
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
        return <Dashboard setView={setView} />;
      case 'doctors':
        return (
          <DoctorSearch
            onSelectDoctor={(doc) => {
              setSelectedDoctor(doc);
              setView('doctor-details');
            }}
          />
        );
      case 'doctor-details':
        return (
          <DoctorDetails
            doctor={selectedDoctor}
            onBack={() => setView('doctors')}
          />
        );
      case 'hospitals':
        return <HospitalSearch />;
      case 'appointments':
        return (
          <AppointmentList
            onSelectAppointment={(app) => {
              setSelectedAppointment(app);
              setView('appointment-details');
            }}
          />
        );
      case 'appointment-details':
        return (
          <AppointmentDetails
            appointment={selectedAppointment}
            onBack={() => setView('appointments')}
          />
        );
      case 'profile':
        return <ProfileManagement />;
      default:
        return <Dashboard setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentView={view} setView={setView} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </main>
    </div>
  );
}