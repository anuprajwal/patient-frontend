const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.docapp.co.in/api';

const makeRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    ...options.headers,
  };

  // Default Content-Type to application/json unless sending FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
    // Automatically sends HttpOnly cookies across subdomains
    credentials: 'include', 
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    let responseData = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    }

    if (!response.ok) {
      const errorMsg = responseData?.message || '';

      // Account restriction handling (403 on hold or deleted)
      if (response.status === 403 && (errorMsg.includes('hold') || errorMsg.includes('deleted'))) {
        if (typeof window.__onAccountRestricted === 'function') {
          window.__onAccountRestricted({
            status: errorMsg.includes('deleted') ? 'deleted' : 'holded',
            message: errorMsg
          });
        }
        return new Promise(() => {}); // Suspend execution chain
      }

      // Authentication expiry handling
      if (
        response.status === 401|| response.status === 403 || 
        errorMsg.includes('jwt expired') || 
        errorMsg.includes('Invalid or expired token')
      ) {
        window.location.href = 'https://auth.docapp.co.in'; // Redirect to login
        return;
      }
      
      const error = new Error(errorMsg || `HTTP Exception: ${response.status}`);
      error.response = { data: responseData, status: response.status };
      throw error;
    }

    return { data: responseData, status: response.status };
  } catch (error) {
    if (!error.response) {
      error.message = `Network connectivity layer failure: ${error.message}`;
    }
    throw error;
  }
};

export const setAccountRestrictionHandler = (onRestricted) => {
  window.__onAccountRestricted = onRestricted;
};

export const patientEndpoints = {
  // Discovery & Doctor Portfolio
  filterDoctors: ({ specialization = '', name = '', pincode = '', limit = 10, offset = 0 } = {}) => {
    const params = new URLSearchParams();
    
    if (specialization) params.append('specialization', specialization);
    if (name) params.append('name', name);
    if (pincode) params.append('pincode', pincode);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    const queryString = params.toString();
    return makeRequest(`/filter/filter-doctors${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  showDoctorSlots: (doctorId) => 
    makeRequest(`/auth/show-slots/${doctorId}`, { method: 'GET' }),

  getDoctorRating: (doctorId) =>
    makeRequest(`/reviews/get-doctor-rating/${doctorId}`, { method: 'GET' }),

  // Profile Management
  getUserData: () => makeRequest('/auth/get-user-data', { method: 'GET' }),
  completeProfile: (payload) => makeRequest('/auth/profile/complete/general_user', { method: 'PUT', body: payload }),
  uploadPhoto: (formData) => makeRequest('/auth/upload-photo', { method: 'POST', body: formData }),
  deletePhoto: () => makeRequest('/auth/delete-profile-pic', { method: 'DELETE' }),
  changePassword: (newPassword) => makeRequest('/auth/change-password', { method: 'PUT', body: { newPassword } }),

  // OTP Verification Infrastructure
  sendEmailOtp: () => makeRequest('/verify/sendEmailOtp', { method: 'POST' }),
  sendMobileOtp: () => makeRequest('/verify/sendMobileOtp', { method: 'POST' }),
  verifyOtp: (payload) => makeRequest('/verify/verifyEmailMobile', { method: 'POST', body: payload }),

  // Address CRUD Matrix
  addAddress: (payload) => makeRequest('/address/addAddress', { method: 'POST', body: payload }),
  getAllAddress: () => makeRequest('/address/getAllAddress', { method: 'GET' }),
  updateAddress: (payload) => makeRequest('/address/updateAddress', { method: 'PUT', body: payload }),
  deleteAddress: (addressId) => makeRequest('/address/deleteAddress', { method: 'DELETE', body: { addressId } }),

  // Appointments & Razorpay Payment Integrations
  listAppointments: () => 
    makeRequest('/appointment/list-appointments', { method: 'GET' }),
    
  createAppointment: (payload) =>
    makeRequest('/appointment/create-appointment', { method: 'POST', body: payload }),

  // Follow-up Checkup Appointment Scheduling
  scheduleCheckupAppointment: (payload) =>
    makeRequest('/appointment/schedule-checkup-appointment', { method: 'POST', body: payload }),

  verifyPayment: (payload) =>
    makeRequest('/verify', { method: 'POST', body: payload }),

  confirmAppointment: (payload) =>
    makeRequest('/appointment/confirm-appointment', { method: 'PUT', body: payload }),

  // Supporting Medical Documents CRUD
  uploadAppointmentDocument: (formData) =>
    makeRequest('/appointment/upload-appointment-document', { method: 'POST', body: formData }),
    
  deleteAppointmentDocument: (documentId) =>
    makeRequest(`/appointment/delete-document/${documentId}`, { method: 'DELETE' }),
    
  replaceAppointmentDocument: (documentId, formData) =>
    makeRequest(`/appointment/replace-document/${documentId}`, { method: 'PUT', body: formData }),

  submitDoctorReview: (payload) =>
    makeRequest('/reviews/doctor-review-ratings', { method: 'POST', body: payload }),
    
  getSingleDocument: (documentId) =>
    makeRequest(`/appointment/get-document/${documentId}`, { method: 'GET' }),
    
  getDocumentsForAppointment: (appointmentId) =>
    makeRequest(`/appointment/get-document-for/${appointmentId}`, { method: 'GET' }),

  getPrescriptionForAppointment: (appointmentId) => 
    makeRequest(`/appointment/get-prescription-for/${appointmentId}`, { method: 'GET' }),

  getDoctorAddressByUserId: (userId) => 
    makeRequest(`/address/getAllAddress/${userId}`, { method: 'GET' }),

  filterHospitals: (type = 'hospital', limit = 10, offset = 0, pincode = '') =>
    makeRequest(
      `/filter/filter-hospitals?type=${encodeURIComponent(type)}&limit=${limit}&offset=${offset}${
        pincode ? `&pincode=${encodeURIComponent(pincode)}` : ''
      }`,
      { method: 'GET' }
    ),

  // Fetch Doctors belonging to an Organisation / Hospital
  getHospitalDoctors: (organisationId, limit = 10, offset = 0) =>
    makeRequest(`/filter/get-hospital-doctors/${organisationId}?limit=${limit}&offset=${offset}`, { method: 'GET' }),

  saveNotificationToken: (spmToken, platform = 'web') => 
    makeRequest('/notifications/save-token', { method: 'POST', body: { spmToken, platform } }),

  logout: () => {
    window.location.href = 'https://auth.docapp.co.in';
  }
};