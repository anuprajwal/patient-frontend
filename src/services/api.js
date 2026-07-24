import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getCookieToken = () => {
  const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const deleteAuthCookiesAndRedirect = () => {
  document.cookie = "auth_token=; path=/; domain=.docapp.co.in; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
  document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
  window.location.href = 'https://auth.docapp.co.in';
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getCookieToken() || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const setAccountRestrictionHandler = (onRestricted) => {
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorMsg = error.response?.data?.message || '';
      
      if (error.response?.status === 403 && (errorMsg.includes('hold') || errorMsg.includes('deleted'))) {
        onRestricted({
          status: errorMsg.includes('deleted') ? 'deleted' : 'holded',
          message: errorMsg
        });
        return new Promise(() => {});
      }

      if (
        error.response?.status === 401 || 
        errorMsg.includes('jwt expired') || 
        errorMsg.includes('Invalid or expired admin token')
      ) {
        deleteAuthCookiesAndRedirect();
      }
      return Promise.reject(error);
    }
  );
};

export const patientEndpoints = {
  // Discovery Matrix
  filterDoctors: (specialization = '') => 
    apiClient.get(`/filter/filter-doctors${specialization ? `?specialization=${specialization}` : ''}`),
  
  searchDoctorsByName: (name = '') =>
    apiClient.get(`/filter/search-doctor-name?name=${encodeURIComponent(name)}`),

  showDoctorSlots: (doctorId) => 
    apiClient.get(`/auth/show-slots/${doctorId}`),
  
  filterHospitals: (type = 'hospital', pincode = '') => 
    apiClient.get(`/filter/filter-hospitals?type=${type}${pincode ? `&pincode=${pincode}` : ''}`),

  // Profile Lifecycle
  getUserData: () => 
    apiClient.get('/auth/get-user-data'),
  
  // Changed from POST to PUT request as requested
  completeProfile: (payload) => 
    apiClient.put('/auth/profile/complete/general_user', payload),
  
  uploadPhoto: (formData) => 
    apiClient.post('/auth/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deletePhoto: () => 
    apiClient.delete('/auth/delete-profile-pic'),
  
  changePassword: (newPassword) => 
    apiClient.put('/auth/change-password', { newPassword }),

  // OTP Verification Infrastructure
  sendEmailOtp: () => 
    apiClient.post('/verify/sendEmailOtp'),
  
  sendMobileOtp: () => 
    apiClient.post('/verify/sendMobileOtp'),
  
  verifyOtp: (payload) => 
    apiClient.post('/verify/verifyEmailMobile', payload),

  // Address CRUD Matrix
  addAddress: (payload) => 
    apiClient.post('/address/addAddress', payload),
  
  getAllAddress: () => 
    apiClient.get('/address/getAllAddress'),
  
  updateAddress: (payload) => 
    apiClient.put('/address/updateAddress', payload),
  
  // Switched to standard DELETE request transmitting JSON payload schema mapping parameters
  deleteAddress: (addressId) => 
    apiClient.delete('/address/deleteAddress', { data: { addressId } }),

  // Appointments Ecosystem
  listAppointments: () => 
    apiClient.get('/appointment/list-appointments'),

  createAppointment: (payload) =>
    apiClient.post('/appointment/create-appointment', payload),
    
  logout: () => deleteAuthCookiesAndRedirect()
};