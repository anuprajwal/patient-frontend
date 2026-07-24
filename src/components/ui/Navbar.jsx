import React from 'react';
import { Search, Building2, Calendar, User, LogOut } from 'lucide-react';

export default function Navbar({ currentView, setView }) {
  const navItems = [
    { id: 'doctors', name: 'Find Doctors', icon: Search },
    { id: 'hospitals', name: 'Find Hospitals', icon: Building2 },
    { id: 'appointments', name: 'My Appointments', icon: Calendar },
    { id: 'profile', name: 'Profile Settings', icon: User },
  ];

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      const deleteAuthCookiesAndRedirect = () => {
        document.cookie = "auth_token=; path=/; domain=.docapp.co.in; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        window.location.href = 'https://auth.docapp.co.in';
      };
      deleteAuthCookiesAndRedirect();
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setView('dashboard')}>
              <span className="text-xl font-bold text-brand-600 tracking-tight">DocApp</span>
              <span className="ml-1.5 px-2 py-0.5 rounded text-xs bg-brand-50 text-brand-600 font-semibold border border-brand-200">Patient</span>
            </div>
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-brand-50 text-brand-600 border border-brand-200' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-500 hover:text-rose-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}