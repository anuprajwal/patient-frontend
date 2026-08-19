// src/context/CallContext.jsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../services/firebaseClient';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onMessage } from 'firebase/messaging';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { callService } from '../services/callService';

const CallContext = createContext(null);

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const CallProvider = ({ children, currentUserId }) => {
  const [callState, setCallState] = useState('IDLE'); // IDLE | RINGING_OUT | RINGING_IN | CONNECTING | IN_CALL
  const [activeCallId, setActiveCallId] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [activeCallDetails, setActiveCallDetails] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState(null);

  const pc = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const screenTrack = useRef(null);
  const timerRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  const unsubCallDoc = useRef(null);
  const unsubCandidates = useRef(null);
  const unsubUserCalls = useRef(null);

  const getUserId = () => {
    if (currentUserId) return currentUserId;
    try {
      const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
      if (match) {
        const payload = JSON.parse(atob(match[2].split('.')[1]));
        return payload.id || payload.user_id || payload.sub;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // 1. Foreground FCM Push Listener
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    const messaging = getMessaging(app);

    const unsubscribeFCM = onMessage(messaging, (payload) => {
      const data = payload.data || {};
      if (data.action === 'INCOMING_CALL' && data.call_id) {
        let details = {};
        try {
          details = typeof data.call_details === 'string' 
            ? JSON.parse(data.call_details) 
            : (data.call_details || {});
        } catch (e) {
          details = {};
        }

        const uid = getUserId();
        if (!uid || !details.call_to_userid || parseInt(details.call_to_userid, 10) === parseInt(uid, 10)) {
          setIncomingCallData({
            call_id: data.call_id,
            appointment_id: data.appointment_id,
            ...details,
          });
          setCallState((prev) => (prev === 'IDLE' ? 'RINGING_IN' : prev));
        }
      }
    });

    return () => {
      if (typeof unsubscribeFCM === 'function') unsubscribeFCM();
    };
  }, [currentUserId]);

  // 2. Firestore Fallback Listener
  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;

    const userHistoryRef = collection(db, 'calls', String(uid), 'history');
    unsubUserCalls.current = onSnapshot(userHistoryRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          const callId = change.doc.id;

          if (
            (data.call_status || '').toLowerCase().includes('ring') &&
            data.call_request &&
            parseInt(data.call_request.call_to_userid, 10) === parseInt(uid, 10)
          ) {
            const expiresAt = data.expires_at?.toMillis ? data.expires_at.toMillis() : new Date(data.expires_at).getTime();
            if (!expiresAt || expiresAt > Date.now()) {
              setIncomingCallData({
                call_id: callId,
                ...data.call_request,
              });
              setCallState((prev) => (prev === 'IDLE' ? 'RINGING_IN' : prev));
            }
          }
        }
      });
    });

    return () => {
      if (unsubUserCalls.current) unsubUserCalls.current();
    };
  }, [currentUserId]);

  // Duration Timer
  useEffect(() => {
    if (callState === 'IN_CALL') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  // WebRTC Peer Connection Setup
  const setupMediaAndConnection = async () => {
    if (pc.current) {
      pc.current.close();
    }

    pc.current = new RTCPeerConnection(RTC_CONFIG);
    remoteStream.current = new MediaStream();
    iceCandidatesQueue.current = [];

    let selectedVideoConstraints = { width: { ideal: 1280 }, height: { ideal: 720 } };

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      const nativeCam = videoDevices.find(
        (d) =>
          !d.label.toLowerCase().includes('phone') &&
          !d.label.toLowerCase().includes('virtual') &&
          !d.label.toLowerCase().includes('i2403')
      );

      if (nativeCam && nativeCam.deviceId) {
        selectedVideoConstraints = {
          deviceId: { exact: nativeCam.deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };
      }
    } catch (err) {
      console.warn('Device enumeration fallback:', err);
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: selectedVideoConstraints,
      audio: { echoCancellation: true, noiseSuppression: true },
    });

    localStream.current = stream;

    stream.getTracks().forEach((track) => {
      pc.current.addTrack(track, stream);
    });

    pc.current.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStream.current = event.streams[0];
      } else {
        remoteStream.current.addTrack(event.track);
      }
    };

    pc.current.onconnectionstatechange = () => {
      if (pc.current?.connectionState === 'connected') {
        setCallState('IN_CALL');
      } else if (['disconnected', 'failed', 'closed'].includes(pc.current?.connectionState)) {
        terminateCallSession(false);
      }
    };

    return pc.current;
  };

  // Drain Queued Candidates Helper
  const drainIceCandidates = async (peerConnection) => {
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Error draining ICE candidate:', err);
      }
    }
  };

  // CALLER: Start Call
  const initiateCall = async (appointmentId) => {
    try {
      setCallError(null);
      setCallState('CONNECTING');

      const peerConn = await setupMediaAndConnection();

      const offer = await peerConn.createOffer();
      await peerConn.setLocalDescription(offer);

      const res = await callService.initialiseCall(appointmentId, {
        sdp: offer.sdp,
        type: offer.type,
      });

      const { call_id } = res.data;
      setActiveCallId(call_id);
      setCallState('RINGING_OUT');

      peerConn.onicecandidate = (event) => {
        if (event.candidate) {
          callService.addOfferCandidate(call_id, event.candidate).catch((err) =>
            console.warn('Error sending offer ICE candidate:', err)
          );
        }
      };

      const callDocRef = doc(db, 'call_history', call_id);
      unsubCallDoc.current = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        setActiveCallDetails(data.call_request);

        // 1. Process Answer (Case-Insensitive & robust property handling)
        if (data.answer && !peerConn.currentRemoteDescription) {
          const answerSdp = typeof data.answer === 'string'
            ? { type: 'answer', sdp: data.answer }
            : { type: data.answer.type || 'answer', sdp: data.answer.sdp || data.answer };

          await peerConn.setRemoteDescription(new RTCSessionDescription(answerSdp));
          await drainIceCandidates(peerConn);
          setCallState('IN_CALL');
        }

        const currentStatus = (data.call_status || '').toLowerCase();
        if (currentStatus.includes('reject') || currentStatus.includes('complete')) {
          terminateCallSession(false);
        }
      });

      // 2. Queue or Add Callee Answer Candidates
      const answerCandidatesRef = collection(db, 'call_history', call_id, 'answerCandidates');
      unsubCandidates.current = onSnapshot(answerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            if (peerConn.remoteDescription && peerConn.remoteDescription.type) {
              try {
                await peerConn.addIceCandidate(new RTCIceCandidate(candidateData));
              } catch (e) {
                console.warn('Error adding answer ICE candidate:', e);
              }
            } else {
              iceCandidatesQueue.current.push(candidateData);
            }
          }
        });
      });
    } catch (err) {
      console.error('Call initialization error:', err);
      setCallError(err.response?.data?.error || err.message || 'Failed to initiate call');
      terminateCallSession(false);
    }
  };

  // CALLEE: Accept Call
  const acceptCall = async () => {
    if (!incomingCallData?.call_id) return;
    const callId = incomingCallData.call_id;

    try {
      setCallError(null);
      setCallState('CONNECTING');
      setActiveCallId(callId);
      setActiveCallDetails(incomingCallData);
      setIncomingCallData(null);

      const peerConn = await setupMediaAndConnection();

      peerConn.onicecandidate = (event) => {
        if (event.candidate) {
          callService.addAnswerCandidate(callId, event.candidate).catch((err) =>
            console.warn('Error sending answer ICE candidate:', err)
          );
        }
      };

      // 1. Retrieve & Normalize Caller Offer
      let rawOffer = incomingCallData.offer;
      if (!rawOffer) {
        const offerRes = await callService.getCallOffer(callId);
        rawOffer = offerRes.data.offer_sdp || offerRes.data.offer;
      }

      let normalizedOffer;
      if (typeof rawOffer === 'string') {
        normalizedOffer = { type: 'offer', sdp: rawOffer };
      } else if (rawOffer && typeof rawOffer === 'object') {
        normalizedOffer = {
          type: rawOffer.type || 'offer',
          sdp: rawOffer.sdp || rawOffer,
        };
      }

      if (!normalizedOffer || !normalizedOffer.sdp) {
        throw new Error('Valid SDP Offer could not be resolved from server.');
      }

      await peerConn.setRemoteDescription(new RTCSessionDescription(normalizedOffer));
      await drainIceCandidates(peerConn);

      // 2. Create & Send Answer
      const answer = await peerConn.createAnswer();
      await peerConn.setLocalDescription(answer);

      await callService.receiveCall(callId, {
        sdp: answer.sdp,
        type: answer.type,
      });

      setCallState('IN_CALL');

      // 3. Listen for Offer ICE Candidates from Caller
      const offerCandidatesRef = collection(db, 'call_history', callId, 'offerCandidates');
      unsubCandidates.current = onSnapshot(offerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            if (peerConn.remoteDescription && peerConn.remoteDescription.type) {
              try {
                await peerConn.addIceCandidate(new RTCIceCandidate(candidateData));
              } catch (e) {
                console.warn('Error adding offer ICE candidate:', e);
              }
            } else {
              iceCandidatesQueue.current.push(candidateData);
            }
          }
        });
      });

      // 4. Listen for Call Status Termination
      const callDocRef = doc(db, 'call_history', callId);
      unsubCallDoc.current = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        const currentStatus = (data?.call_status || '').toLowerCase();
        if (currentStatus.includes('reject') || currentStatus.includes('complete')) {
          terminateCallSession(false);
        }
      });
    } catch (err) {
      console.error('Accept call error:', err);
      setCallError(err.response?.data?.error || err.message || 'Failed to accept call');
      terminateCallSession(false);
    }
  };

  // CALLEE: Reject Call
  const rejectCall = async () => {
    if (incomingCallData?.call_id) {
      try {
        await callService.rejectCall(incomingCallData.call_id);
      } catch (err) {
        console.warn('Reject call error:', err);
      }
    }
    setIncomingCallData(null);
    setCallState('IDLE');
  };

  // EITHER PARTY: End Call
  const endCall = async () => {
    if (activeCallId) {
      try {
        await callService.changeCallStatus(activeCallId, 'Call Completed');
      } catch (err) {
        console.warn('Error updating call status to completed:', err);
      }
    }
    terminateCallSession(true);
  };

  const terminateCallSession = (isLocalAction = true) => {
    if (unsubCallDoc.current) {
      unsubCallDoc.current();
      unsubCallDoc.current = null;
    }
    if (unsubCandidates.current) {
      unsubCandidates.current();
      unsubCandidates.current = null;
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    if (screenTrack.current) {
      screenTrack.current.stop();
      screenTrack.current = null;
    }
    if (remoteStream.current) {
      remoteStream.current.getTracks().forEach((track) => track.stop());
      remoteStream.current = null;
    }

    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }

    iceCandidatesQueue.current = [];
    setActiveCallId(null);
    setActiveCallDetails(null);
    setIncomingCallData(null);
    setIsAudioMuted(false);
    setIsVideoDisabled(false);
    setIsScreenSharing(false);
    setCallState('IDLE');
  };

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!pc.current || !localStream.current) return;

    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenVideoTrack = displayStream.getVideoTracks()[0];
        screenTrack.current = screenVideoTrack;

        const sender = pc.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenVideoTrack);
        }

        screenVideoTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share cancelled/denied:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (screenTrack.current) {
      screenTrack.current.stop();
      screenTrack.current = null;
    }
    const origVideoTrack = localStream.current?.getVideoTracks()[0];
    const sender = pc.current?.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (sender && origVideoTrack) {
      sender.replaceTrack(origVideoTrack);
    }
    setIsScreenSharing(false);
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        activeCallId,
        incomingCallData,
        activeCallDetails,
        localStream,
        remoteStream,
        isAudioMuted,
        isVideoDisabled,
        isScreenSharing,
        callDuration,
        callError,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};