import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.docapp.co.in/api';

const getCookieToken = () => {
  const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : localStorage.getItem('auth_token');
};

const deleteAuthCookiesAndRedirect = () => {
  document.cookie = "auth_token=; path=/; domain=.docapp.co.in; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
  document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
  localStorage.removeItem('auth_token');
  window.location.href = 'https://auth.docapp.co.in';
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getCookieToken();
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
  // Discovery & Doctor Portfolio
  filterDoctors: (specialization = '') => 
    apiClient.get(`/filter/filter-doctors${specialization ? `?specialization=${specialization}` : ''}`),
  
  searchDoctorsByName: (name = '') =>
    apiClient.get(`/filter/search-doctor-name?name=${encodeURIComponent(name)}`),

  showDoctorSlots: (doctorId) => 
    apiClient.get(`/auth/show-slots/${doctorId}`),
  
  filterHospitals: (type = 'hospital', pincode = '') => 
    apiClient.get(`/filter/filter-hospitals?type=${type}${pincode ? `&pincode=${pincode}` : ''}`),

  getDoctorRating: (doctorId) =>
    apiClient.get(`/reviews/get-doctor-rating/${doctorId}`),

  // Profile Management
  getUserData: () => apiClient.get('/auth/get-user-data'),
  completeProfile: (payload) => apiClient.put('/auth/profile/complete/general_user', payload),
  uploadPhoto: (formData) => apiClient.post('/auth/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: () => apiClient.delete('/auth/delete-profile-pic'),
  changePassword: (newPassword) => apiClient.put('/auth/change-password', { newPassword }),

  // OTP Verification Infrastructure
  sendEmailOtp: () => apiClient.post('/verify/sendEmailOtp'),
  sendMobileOtp: () => apiClient.post('/verify/sendMobileOtp'),
  verifyOtp: (payload) => apiClient.post('/verify/verifyEmailMobile', payload),

  // Address CRUD Matrix
  addAddress: (payload) => apiClient.post('/address/addAddress', payload),
  getAllAddress: () => apiClient.get('/address/getAllAddress'),
  updateAddress: (payload) => apiClient.put('/address/updateAddress', payload),
  deleteAddress: (addressId) => apiClient.delete('/address/deleteAddress', { data: { addressId } }),

  // Appointments & Razorpay Payment Integrations
  listAppointments: () => 
    apiClient.get('/appointment/list-appointments'),
    
  createAppointment: (payload) =>
    apiClient.post('/appointment/create-appointment', payload),

  // Follow-up Checkup Appointment Scheduling
  scheduleCheckupAppointment: (payload) =>
    apiClient.post('/appointment/schedule-checkup-appointment', payload),

  verifyPayment: (payload) =>
    apiClient.post('/verify', payload),

  confirmAppointment: (payload) =>
    apiClient.put('/appointment/confirm-appointment', payload),

  // Supporting Medical Documents CRUD
  uploadAppointmentDocument: (formData) =>
    apiClient.post('/appointment/upload-appointment-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
  deleteAppointmentDocument: (documentId) =>
    apiClient.delete(`/appointment/delete-document/${documentId}`),
    
  replaceAppointmentDocument: (documentId, formData) =>
    apiClient.put(`/appointment/replace-document/${documentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
  getSingleDocument: (documentId) =>
    apiClient.get(`/appointment/get-document/${documentId}`),
    
  getDocumentsForAppointment: (appointmentId) =>
    apiClient.get(`/appointment/get-document-for/${appointmentId}`),

  getPrescriptionForAppointment: (appointmentId) => 
    apiClient.get(`/appointment/get-prescription-for/${appointmentId}`),

  getDoctorAddressByUserId: (userId) => 
    apiClient.get(`/address/getAllAddress/${userId}`),

  filterHospitals: (type = 'hospital', limit = 10, offset = 0, pincode = '') =>
    apiClient.get(
      `/filter/filter-hospitals?type=${encodeURIComponent(type)}&limit=${limit}&offset=${offset}${
        pincode ? `&pincode=${encodeURIComponent(pincode)}` : ''
      }`
    ),

  // Fetch Doctors belonging to an Organisation / Hospital
  getHospitalDoctors: (organisationId, limit = 10, offset = 0) =>
    apiClient.get(`/filter/get-hospital-doctors/${organisationId}?limit=${limit}&offset=${offset}`),

  saveNotificationToken: (token, platform = 'web') => 
    apiClient.post('/notifications/save-token', { spmToken }),

  logout: () => deleteAuthCookiesAndRedirect()
};