import React, { useState, useEffect } from 'react';
import { patientEndpoints } from '../../services/api';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';
import VerificationModal from './VerificationModal';
import { User, Calendar, MapPin, Key, Upload, Trash2, CheckCircle } from 'lucide-react';

export default function ProfileManagement() {
  const [profileForm, setProfileForm] = useState({ date_of_birth: '', gender: '' });
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ country: 'India', state: '', city: '', pincode: '', street: '', landmark: '', houseNo: '' });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '' });
  const [userData, setUserData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [verificationTarget, setVerificationTarget] = useState(null); 

  const syncProfileData = async () => {
    setLoading(true);
    try {
      const userRes = await patientEndpoints.getUserData();
      const rawUserData = userRes.data?.userData || userRes.data;
      setUserData(rawUserData);
      
      if (rawUserData) {
        setProfileForm({
          date_of_birth: rawUserData.generalUser?.date_of_birth?.split('T')[0] || '',
          gender: rawUserData.generalUser?.gender || ''
        });
      }
      
      const addrRes = await patientEndpoints.getAllAddress();
      setAddresses(addrRes.data?.addresses || addrRes.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load profile details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { syncProfileData(); }, []);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await patientEndpoints.completeProfile(profileForm);
      triggerAlert('success', 'Profile updated successfully.');
      syncProfileData();
    } catch (err) {
      triggerAlert('error', 'Could not update profile. Please try again.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      await patientEndpoints.uploadPhoto(fd);
      triggerAlert('success', 'Profile picture uploaded successfully.');
      syncProfileData();
    } catch (err) {
      triggerAlert('error', 'Failed to upload photo.');
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    try {
      await patientEndpoints.deletePhoto();
      triggerAlert('success', 'Profile picture removed.');
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
        triggerAlert('success', 'Address updated successfully.');
      } else {
        await patientEndpoints.addAddress(addressForm);
        triggerAlert('success', 'Address added successfully.');
      }
      setAddressForm({ country: 'India', state: '', city: '', pincode: '', street: '', landmark: '', houseNo: '' });
      setEditingAddressId(null);
      syncProfileData();
    } catch (err) {
      triggerAlert('error', 'Failed to save address.');
    }
  };

  const handleAddressDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await patientEndpoints.deleteAddress(String(id));
      triggerAlert('success', 'Address deleted successfully.');
      syncProfileData();
    } catch (err) {
      triggerAlert('error', 'Failed to delete address.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await patientEndpoints.changePassword(passwordForm.newPassword);
      triggerAlert('success', 'Password changed successfully.');
      setPasswordForm({ newPassword: '' });
    } catch (err) {
      triggerAlert('error', 'Failed to change password.');
    }
  };

  if (loading && !userData) return <Loader />;

  const profilePicUrl = userData?.generalUser?.profile_picture;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Profile & Settings</h2>
        <p className="text-slate-500 text-sm">Manage your personal details, verify your contact information, and update saved addresses.</p>
      </div>

      <Alert type={alert.type} message={alert.message} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification & Avatar Details */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto group">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-slate-100" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-10 h-10" /></div>
              )}
              <label className="absolute bottom-0 right-0 bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-colors">
                <Upload className="w-4 h-4" />
                <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
              </label>
            </div>
            {profilePicUrl && (
              <button onClick={handlePhotoDelete} className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 mx-auto transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Remove Photo
              </button>
            )}

            <div className="border-t border-slate-100 pt-4 text-left space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Account Verification</span>
              
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block">Email</span>
                  <span className="text-slate-400 block mt-0.5 truncate max-w-[160px]">{userData?.email}</span>
                </div>
                {userData?.is_email_verified ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Verified</span>
                ) : (
                  <button onClick={() => setVerificationTarget('email')} className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold px-2.5 py-1 rounded transition-colors">Verify</button>
                )}
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block">Phone Number</span>
                  <span className="text-slate-400 block mt-0.5">{userData?.phone_number || 'Not Added'}</span>
                </div>
                {userData?.is_phone_verified ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Verified</span>
                ) : (
                  <button onClick={() => setVerificationTarget('mobile')} className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold px-2.5 py-1 rounded transition-colors">Verify</button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Key className="w-4 h-4 text-slate-400" /> Change Password</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">New Password</label>
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
              Update Password
            </button>
          </form>
        </div>

        {/* Personal Details & Saved Addresses */}
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleProfileSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={profileForm.date_of_birth}
                  onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Gender</label>
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
                Save Personal Details
              </button>
            </div>
          </form>

          {/* Saved Addresses */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Saved Addresses</h3>
            
            <form onSubmit={handleAddressSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Street Address</label>
                <input type="text" required value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">House / Flat No.</label>
                <input type="text" value={addressForm.houseNo} onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">City</label>
                <input type="text" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">State</label>
                <input type="text" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Pincode</label>
                <input type="text" required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
              </div>
              <div className="sm:col-span-2 flex items-end justify-between gap-3 mt-2 sm:mt-0">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Landmark (Optional)</label>
                  <input type="text" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 font-medium" />
                </div>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg h-fit shadow-sm border border-slate-800">
                  {editingAddressId ? 'Save Address' : 'Add Address'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="border border-slate-200 p-4 rounded-xl flex justify-between items-start hover:bg-slate-50/50 transition-colors">
                  <div className="text-sm">
                    <p className="font-bold text-slate-800">{addr.street} {addr.houseNo ? `, Apt ${addr.houseNo}` : ''}</p>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">{addr.city}, {addr.state} - <span className="text-slate-700 font-semibold">{addr.pincode}</span> | {addr.country}</p>
                    {addr.landmark && <p className="text-slate-400 text-[11px] italic mt-1 font-medium">Landmark: {addr.landmark}</p>}
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
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {addresses.length === 0 && (
                <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  No saved addresses found. Use the form above to add an address.
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