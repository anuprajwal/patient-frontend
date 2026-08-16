import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import { Building2, MapPin, Stethoscope, ChevronLeft, ChevronRight, Search, ShieldCheck } from 'lucide-react';

export default function HospitalSearch({ onSelectHospital }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pincode, setPincode] = useState('');

  // Pagination state
  const [limit] = useState(6);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchHospitals = async (currentOffset = offset, currentPin = pincode) => {
    setLoading(true);
    setError('');
    try {
      const response = await patientEndpoints.filterHospitals('hospital', limit, currentOffset, currentPin);
      const data = response.data;
      setHospitals(data?.organisations || []);
      setTotalRecords(data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hospitals from server.');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals(offset, pincode);
  }, [offset]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setOffset(0);
    fetchHospitals(0, pincode);
  };

  const handleNextPage = () => {
    if (offset + limit < totalRecords) {
      setOffset((prev) => prev + limit);
    }
  };

  const handlePrevPage = () => {
    if (offset - limit >= 0) {
      setOffset((prev) => prev - limit);
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Directory</h2>
        <p className="text-slate-500 text-sm mt-1">Browse partner hospitals and view specialized medical practitioners.</p>
      </div>

      {/* Filter / Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Search by pincode (e.g. 500001)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2 rounded-lg transition-colors shadow-sm"
        >
          Search
        </button>
      </form>

      {error && <Alert type="error" message={error} />}

      {loading ? (
        <Loader />
      ) : hospitals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">No hospitals found matching criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hospital) => {
            const specializations = hospital.specializations_provided
              ? Array.isArray(hospital.specializations_provided)
                ? hospital.specializations_provided
                : JSON.parse(hospital.specializations_provided || '[]')
              : [];

            return (
              <div
                key={hospital.id}
                onClick={() => onSelectHospital(hospital)}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={hospital.profile_picture || 'https://res.cloudinary.com/dwshjkk42/image/upload/v1751270847/hospital-building_4821512_qr0gvo.png'}
                      alt={hospital.organisation_name || 'Hospital'}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-base truncate group-hover:text-blue-600 transition-colors">
                          {hospital.organisation_name || 'Hospital Facility'}
                        </h4>
                        {hospital.verified_status && (
                          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" title="Verified Hospital" />
                        )}
                      </div>
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        {hospital.address?.street
                          ? `${hospital.address.street}, ${hospital.address.city || ''} - ${hospital.address.pincode || ''}`
                          : 'Location details available on request'}
                      </p>
                    </div>
                  </div>

                  {hospital.description && (
                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                      {hospital.description}
                    </p>
                  )}

                  {specializations.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Specializations</span>
                      <div className="flex flex-wrap gap-1.5">
                        {specializations.slice(0, 3).map((spec, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium border border-slate-200"
                          >
                            <Stethoscope className="w-3 h-3 text-slate-400" /> {spec}
                          </span>
                        ))}
                        {specializations.length > 3 && (
                          <span className="text-[11px] text-slate-500 font-medium px-1.5 py-0.5">
                            +{specializations.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    {hospital.ambulance_available ? '🚑 Ambulance On-Call' : 'Standard Service'}
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    View Doctors & Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalRecords > limit && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{offset + 1}</span> to{' '}
            <span className="font-bold text-slate-800">{Math.min(offset + limit, totalRecords)}</span> of{' '}
            <span className="font-bold text-slate-800">{totalRecords}</span> hospitals
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={offset === 0 || loading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={offset + limit >= totalRecords || loading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}