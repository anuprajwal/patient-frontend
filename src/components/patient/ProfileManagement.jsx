import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import VerificationModal from './VerificationModal';
import { User, Calendar, Shield, MapPin, Key, Upload, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function ProfileManagement() {
  const [profileForm, setProfileForm] = useState({ date_of_birth: '', gender: '' });
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ country: 'India', state: '', city: '', pincode: '', street: '', landmark: '', houseNo: '' });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '' });
  const [userData, setUserData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [verificationTarget, setVerificationTarget] = useState(null); // 'email' | 'mobile'

  const syncProfileData = async () => {
    setLoading(true);
    try {
      const userRes = await patientEndpoints.getUserData();
      setUserData(userRes.data?.user || userRes.data);
      if (userRes.data?.user) {
        setProfileForm({
          date_of_birth: userRes.data.user.date_of_birth?.split('T')[0] || '',
          gender: userRes.data.user.gender || ''
        });
      }
      const addrRes = await patientEndpoints.getAllAddress();
      setAddresses(addrRes.data?.addresses || addrRes.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to sync authentication profile parameters.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { syncProfileData(); }, []);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await patientEndpoints.completeProfile(profileForm);
      triggerAlert('success', 'Demographic parameters mutated successfully.');
      syncProfileData();
    } catch (err) {
      triggerAlert('error', 'Profile mutation pipeline exception.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      await patientEndpoints.uploadPhoto(fd);
      triggerAlert('success', 'Profile picture streamed successfully.');
      syncProfileData();
    } catch (err) {
      triggerAlert('error', 'Image multipart transmission failed.');
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm("Confirm photo detachment?")) return;
    try {
      await patientEndpoints.deletePhoto();
      triggerAlert('success', 'Photo resource detached successfully.');
      syncProfileData();
    } catch (err) {
      triggerAlert('error', 'Failed to delete photo.');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await patientEndpoints.updateAddress({ addressId: editingAddressId, ...addressForm });
        triggerAlert('success', 'Clinic address entry mutated cleanly.');
      } else {
        await patientEndpoints.addAddress(addressForm);
        triggerAlert('success', 'New clinic physical location initialized.');
      }
      setAddressForm({ country: 'India', state: '', city: '', pincode: '', street: '', landmark: '', houseNo: '' });
      setEditingAddressId(null);
      syncProfileData();
    } catch (err) {
      triggerAlert('error', 'Address CRUD transaction interrupted.');
    }
  };

  const handleAddressDelete = async (id) => {
    if (!confirm("Permanently delete address node?")) return;
    try {
      await patientEndpoints.deleteAddress(id);
      triggerAlert('success', 'Address record dropped from ledger.');
      syncProfileData();
    } catch (err) {
      triggerAlert('error', 'Failed to purge address target.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await patientEndpoints.changePassword(passwordForm.newPassword);
      triggerAlert('success', 'Security authentication keys updated.');
      setPasswordForm({ newPassword: '' });
    } catch (err) {
      triggerAlert('error', 'Password re-configuration error.');
    }
  };

  if (loading && !userData) return <Loader />;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Account Identity Matrix</h2>
        <p className="text-slate-500 text-sm">Manage dynamic data variables, verify compliance markers, and adjust billing locations.</p>
      </div>

      <Alert type={alert.type} message={alert.message} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification & Avatar Metrics */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto group">
              {userData?.profile_picture ? (
                <img src={userData.profile_picture} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-slate-100" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-10 'h-10" /></div>
              )}
              <label className="absolute bottom-0 right-0 bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-colors">
                <Upload className="w-4 h-4" />
                <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
              </label>
            </div>
            {userData?.profile_picture && (
              <button onClick={handlePhotoDelete} className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 mx-auto transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Purge Image
              </button>
            )}

            <div className="border-t border-slate-100 pt-4 text-left space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Compliance Checks</span>
              
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block">Email Address</span>
                  <span className="text-slate-400 block mt-0.5 truncate max-w-[160px]">{userData?.email}</span>
                </div>
                {userData?.is_email_verified ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Passed</span>
                ) : (
                  <button onClick={() => setVerificationTarget('email')} className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold px-2.5 py-1 rounded transition-colors">Verify</button>
                )}
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block">Mobile Network</span>
                  <span className="text-slate-400 block mt-0.5">{userData?.phone_number || 'Not Registered'}</span>
                </div>
                {userData?.is_phone_verified ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Passed</span>
                ) : (
                  <button onClick={() => setVerificationTarget('mobile')} className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold px-2.5 py-1 rounded transition-colors">Verify</button>
                )}
              </div>
            </div>
          </div>

          {/* Password Updates */}
          <form onSubmit={handlePasswordSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Key className="w-4 h-4 text-slate-400" /> Security Layer Overrides</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">New System Password</label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ newPassword: e.target.value })}
                placeholder="••••••••"
                className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors shadow-sm">
              Mutate Core Keys
            </button>
          </form>
        </div>

        {/* Demographic & Address Modules */}
        <div className="space-y-6 lg:col-span-2">
          {/* Demographic Parameters */}
          <form onSubmit={handleProfileSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Demographic Constraints</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Date Of Birth</label>
                <input
                  type="date"
                  required
                  value={profileForm.date_of_birth}
                  onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Gender Specifier</label>
                <select
                  required
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium appearance-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-sm">
                Commit Demographics
              </button>
            </div>
          </form>

          {/* Address Ledger Framework */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Practice & Billing Address Matrix</h3>
            
            <form onSubmit={handleAddressSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Street Line</label>
                <input type="text" required value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">House / Suite No</label>
                <input type="text" value={addressForm.houseNo} onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">City Node</label>
                <input type="text" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">State / Province</label>
                <input type="text" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Zip Pincode</label>
                <input type="text" required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div className="sm:col-span-2 flex items-end justify-between gap-3 mt-2 sm:mt-0">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Landmark Parameter</label>
                  <input type="text" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg h-fit shadow-sm border border-slate-800">
                  {editingAddressId ? 'Save Node' : 'Push Address'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="border border-slate-200 p-4 rounded-xl flex justify-between items-start hover:bg-slate-50/50 transition-colors">
                  <div className="text-sm">
                    <p className="font-bold text-slate-800">{addr.street} {addr.houseNo ? `, Apt ${addr.houseNo}` : ''}</p>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">{addr.city}, {addr.state} - <span className="text-slate-700 font-semibold">{addr.pincode}</span> | {addr.country}</p>
                    {addr.landmark && <p className="text-slate-400 text-[11px] italic mt-1 font-medium">Ref: {addr.landmark}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingAddressId(addr.id);
                        setAddressForm({ country: addr.country || 'India', state: addr.state, city: addr.city, pincode: addr.pincode, street: addr.street, landmark: addr.landmark || '', houseNo: addr.house_no || addr.houseNo || '' });
                      }}
                      className="text-xs bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold px-2.5 py-1.5 rounded-lg shadow-sm"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleAddressDelete(addr.id)} className="text-xs bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-bold px-2.5 py-1.5 rounded-lg shadow-sm">
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {addresses.length === 0 && (
                <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  No billing addresses recorded inside the database ledger framework.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {verificationTarget && (
        <VerificationModal 
          target={verificationTarget} 
          phoneNumber={userData?.phone_number}
          onClose={() => setVerificationTarget(null)} 
          onSuccess={() => { setVerificationTarget(null); syncProfileData(); }} 
        />
      )}
    </div>
  );
}