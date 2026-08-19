// src/services/callService.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apis.docapp.co.in';

const callApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

callApi.interceptors.request.use((config) => {
  const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
  if (match) {
    config.headers['Authorization'] = `Bearer ${match[2]}`;
  }
  return config;
});

export const callService = {
  // POST /initialise-call -> { appointment_id, offer }
  initialiseCall: (appointmentId, offer) =>
    callApi.post('/api/call/initialise-call', {
      appointment_id: String(appointmentId),
      offer,
    }),

  // PUT /recieve-call -> { call_id, answer }
  receiveCall: (callId, answer) =>
    callApi.put('/api/call/recieve-call', {
      call_id: callId,
      answer,
    }),

  // PUT /reject-call -> { call_id }
  rejectCall: (callId) =>
    callApi.put('/api/call/reject-call', {
      call_id: callId,
    }),

  // PUT /change-call-status -> { call_id, call_status }
  changeCallStatus: (callId, callStatus) =>
    callApi.put('/api/call/change-call-status', {
      call_id: callId,
      call_status: callStatus, // "Call Completed" | "Rejected"
    }),

  // POST /add-offer-candidates -> { call_id, offer_candidate }
  addOfferCandidate: (callId, candidate) =>
    callApi.post('/api/call/add-offer-candidates', {
      call_id: callId,
      offer_candidate: {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      },
    }),

  // POST /add-answer-candidates -> { call_id, answer_candidate }
  addAnswerCandidate: (callId, candidate) =>
    callApi.post('/api/call/add-answer-candidates', {
      call_id: callId,
      answer_candidate: {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      },
    }),

  // GET /get-call-offer?call_id=...
  getCallOffer: (callId) =>
    callApi.get(`/api/call/get-call-offer?call_id=${callId}`),
};