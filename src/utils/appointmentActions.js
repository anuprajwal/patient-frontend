/**
 * Utility handlers for Appointment Details Actions
 */

// Formats appointment statuses into readable text and badge styles
export const getAppointmentStatusMeta = (status) => {
  const normalized = (status || '').toLowerCase();
  
  if (normalized === 'closed') {
    return {
      label: 'Appointment Completed',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      type: 'completed'
    };
  }
  
  return {
    label: 'Not Yet Completed',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    type: 'pending'
  };
};

// Action 1: Triggers the Call Doctor action
export const handleCallDoctor = (appointment) => {
  if (appointment?.doctor_phone) {
    window.location.href = `tel:${appointment.doctor_phone}`;
  } else {
    alert(`Call Doctor feature for Dr. ${appointment.doctorName || 'Practitioner'} is currently under development.`);
  }
};

// Action 2: Opens the Address modal or Google Maps location view
export const handleGetAddress = (appointment, openAddressModalCallback) => {
  if (openAddressModalCallback) {
    openAddressModalCallback(appointment);
  } else if (appointment?.address) {
    const addr = appointment.address;
    const fullAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`;
    alert(`Clinic Address:\n${fullAddress}`);
  } else {
    alert("Address details for this clinic location are currently unavailable.");
  }
};