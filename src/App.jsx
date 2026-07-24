import React, { useState } from 'react';
import Navbar from './components/ui/Navbar';
import Dashboard from './components/patient/Dashboard';
import DoctorSearch from './components/patient/DoctorSearch';
import DoctorDetails from './components/patient/DoctorDetails';
import HospitalSearch from './components/patient/HospitalSearch';
import AppointmentList from './components/patient/AppointmentList';
import ProfileManagement from './components/patient/ProfileManagement';

export default function App() {
  const [view, setView] = useState('dashboard'); // dashboard | doctors | doctor-details | hospitals | appointments | profile
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const renderActiveView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard setView={setView} />;
      case 'doctors': return (
        <DoctorSearch onSelectDoctor={(doc) => {
          setSelectedDoctor(doc);
          setView('doctor-details');
        }} />
      );
      case 'doctor-details': return (
        <DoctorDetails doctor={selectedDoctor} onBack={() => setView('doctors')} />
      );
      case 'hospitals': return <HospitalSearch />;
      case 'appointments': return <AppointmentList />;
      case 'profile': return <ProfileManagement />;
      default: return <Dashboard setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentView={view} setView={setView} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-transparent rounded-none">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}