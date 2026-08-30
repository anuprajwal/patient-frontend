import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { getPersistedSelection, persistSelection } from '../../utils/navigationStorage';
import {
  MapPin,
  Globe,
  Award,
  Calendar,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Stethoscope,
  Clock,
  IndianRupee
} from 'lucide-react';

const formatDoctorExperience = (practiceStartDate, legacyYears) => {
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
      if (years > 0 && months > 0) return `${years} yr ${months} mos exp`;
      if (years > 0) return `${years} yrs exp`;
      return `${months} mos exp`;
    }
  }
  return legacyYears ? `${legacyYears} yrs exp` : 'Practitioner';
};

export default function HospitalDetails({ hospital: propHospital, onBack, onSelectDoctor }) {
  const [currentHospital, setCurrentHospital] = useState(() => propHospital || getPersistedSelection('hospital'));
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [error, setError] = useState('');

  const [limit] = useState(6);
  const [offset, setOffset] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);

  useEffect(() => {
    if (propHospital) {
      setCurrentHospital(propHospital);
      persistSelection('hospital', propHospital);
    }
  }, [propHospital]);

  useEffect(() => {
    const targetId = currentHospital?.user_id || currentHospital?.id;
    if (targetId) {
      fetchDoctors(targetId, offset);
    }
  }, [currentHospital, offset]);

  const fetchDoctors = async (orgId, currentOffset) => {
    setLoadingDoctors(true);
    setError('');
    try {
      const response = await patientEndpoints.getHospitalDoctors(orgId, limit, currentOffset);
      const data = response.data;
      setDoctors(data?.doctors || []);
      setTotalDoctors(data?.pagination?.total_records || data?.total || (data?.doctors ? data.doctors.length : 0));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctors for this hospital.');
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  if (!currentHospital) {
    return (
      <div className="bg-white p-8 text-center rounded-2xl border border-slate-200">
        <p className="text-slate-500 mb-4 font-medium">No hospital selected or session expired.</p>
        <button onClick={onBack} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Return to Directory
        </button>
      </div>
    );
  }

  const specializations = currentHospital?.specializations_provided
    ? Array.isArray(currentHospital.specializations_provided)
      ? currentHospital.specializations_provided
      : JSON.parse(currentHospital.specializations_provided || '[]')
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Hospitals Directory
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <img
            src={currentHospital?.profile_picture || 'https://res.cloudinary.com/dwshjkk42/image/upload/v1751270847/hospital-building_4821512_qr0gvo.png'}
            alt={currentHospital?.organisation_name || 'Hospital Profile'}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
          />

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentHospital?.organisation_name || 'Hospital Facility'}
              </h1>
              {currentHospital?.verified_status && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>

            <p className="text-slate-600 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {currentHospital?.address?.street
                ? `${currentHospital.address.street}, ${currentHospital.address.city || ''} - ${currentHospital.address.pincode || ''}`
                : 'Address not specified'}
            </p>

            <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-600 font-medium">
              {currentHospital?.regestration_number && (
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Award className="w-3.5 h-3.5 text-blue-500" /> Reg: {currentHospital.regestration_number}
                </span>
              )}
              {currentHospital?.establishment_year && (
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> Est: {currentHospital.establishment_year}
                </span>
              )}
              {currentHospital?.website_url && (
                <a
                  href={currentHospital.website_url.startsWith('http') ? currentHospital.website_url : `https://${currentHospital.website_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" /> {currentHospital.website_url}
                </a>
              )}
            </div>
          </div>
        </div>

        {currentHospital?.description && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About Hospital</h3>
            <p className="text-slate-700 text-sm leading-relaxed">{currentHospital.description}</p>
          </div>
        )}

        {specializations.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Departments & Services</h3>
            <div className="flex flex-wrap gap-2">
              {specializations.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1.5"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-blue-500" /> {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hospital Doctors Registry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Available Doctors</h2>
            <p className="text-slate-500 text-xs mt-0.5">Specialists actively operating within this hospital network.</p>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}

        {loadingDoctors ? (
          <Loader />
        ) : doctors.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
            <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-medium">No doctors currently listed under this hospital.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc) => {
              const profile = doc.doctorProfile || doc;
              const doctorUser = doc.user || doc;
              const practiceStartDate = profile.practice_start_date || doc.practice_start_date;
              const legacyExp = profile.experience_years || doc.experience_years;
              const experienceLabel = formatDoctorExperience(practiceStartDate, legacyExp);

              return (
                <div
                  key={doc.id || profile.id}
                  onClick={() => onSelectDoctor && onSelectDoctor(doc)}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={profile.profile_picture || 'https://res.cloudinary.com/dwshjkk42/image/upload/v1751270760/doctor_8997187_mgopyu.png'}
                      alt={doctorUser.username || 'Doctor'}
                      className="w-14 h-14 rounded-full object-cover border border-slate-100 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                        {doctorUser.username || profile.full_name || 'Practitioner'}
                      </h4>
                      <p className="text-blue-600 text-xs font-semibold mt-0.5 truncate">
                        {profile.specialization || 'General Specialist'}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {experienceLabel}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                      {profile.consultation_fee || '500.00'}
                    </div>
                    {profile.appointment_time && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {profile.appointment_time} mins
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalDoctors > limit && (
          <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-sm mt-4">
            <span className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{offset + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(offset + limit, totalDoctors)}</span> of{' '}
              <span className="font-bold text-slate-800">{totalDoctors}</span> doctors
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => offset - limit >= 0 && setOffset(prev => prev - limit)}
                disabled={offset === 0 || loadingDoctors}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => offset + limit < totalDoctors && setOffset(prev => prev + limit)}
                disabled={offset + limit >= totalDoctors || loadingDoctors}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}