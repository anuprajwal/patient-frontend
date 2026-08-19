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

  // -------------------------------------------------------------
  // 1. FCM Foreground Push Notification Listener
  // Parses: { action: 'INCOMING_CALL', call_id, call_details }
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    const messaging = getMessaging(app);

    const unsubscribeFCM = onMessage(messaging, (payload) => {
      console.log('🔔 Foreground FCM Message received:', payload);
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
        // Trigger only if current user is indeed the callee
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

  // -------------------------------------------------------------
  // 2. Firestore Realtime Fallback Listener on calls/<userId>/history
  // -------------------------------------------------------------
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
            data.call_status === 'Ringing' &&
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

  // -------------------------------------------------------------
  // Call Duration Timer
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // WebRTC Peer Connection Setup
  // -------------------------------------------------------------
  const setupMediaAndConnection = async () => {
    if (pc.current) {
      pc.current.close();
    }

    pc.current = new RTCPeerConnection(RTC_CONFIG);
    remoteStream.current = new MediaStream();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    localStream.current = stream;

    stream.getTracks().forEach((track) => {
      pc.current.addTrack(track, stream);
    });

    pc.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });
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

  // -------------------------------------------------------------
  // CALLER: Start Call
  // -------------------------------------------------------------
  const initiateCall = async (appointmentId) => {
    try {
      setCallError(null);
      setCallState('CONNECTING');

      const peerConn = await setupMediaAndConnection();

      // Step 1: Create SDP Offer
      const offer = await peerConn.createOffer();
      await peerConn.setLocalDescription(offer);

      // Step 2: Post to backend to trigger Firestore write & FCM push[cite: 4]
      const res = await callService.initialiseCall(appointmentId, {
        sdp: offer.sdp,
        type: offer.type,
      });

      const { call_id } = res.data;
      setActiveCallId(call_id);
      setCallState('RINGING_OUT');

      // Step 3: Stream local ICE candidates to backend[cite: 8]
      peerConn.onicecandidate = (event) => {
        if (event.candidate) {
          callService.addOfferCandidate(call_id, event.candidate).catch((err) =>
            console.warn('Error sending offer ICE candidate:', err)
          );
        }
      };

      // Step 4: Listen for Answer on call_history/<call_id>
      const callDocRef = doc(db, 'call_history', call_id);
      unsubCallDoc.current = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        setActiveCallDetails(data.call_request);

        if (data.call_status === 'Answered' && data.answer && !peerConn.currentRemoteDescription) {
          await peerConn.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallState('IN_CALL');
        }

        if (['Rejected', 'Call Completed'].includes(data.call_status)) {
          terminateCallSession(false);
        }
      });

      // Step 5: Listen for Callee's ICE candidates[cite: 7]
      const answerCandidatesRef = collection(db, 'call_history', call_id, 'answerCandidates');
      unsubCandidates.current = onSnapshot(answerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            try {
              if (peerConn.remoteDescription) {
                await peerConn.addIceCandidate(new RTCIceCandidate(candidateData));
              }
            } catch (e) {
              console.warn('Error adding answer ICE candidate:', e);
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

  // -------------------------------------------------------------
  // CALLEE: Accept Call
  // -------------------------------------------------------------
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

      // Step 1: Stream callee ICE candidates to backend[cite: 7]
      peerConn.onicecandidate = (event) => {
        if (event.candidate) {
          callService.addAnswerCandidate(callId, event.candidate).catch((err) =>
            console.warn('Error sending answer ICE candidate:', err)
          );
        }
      };

      // Step 2: Fetch Caller SDP Offer[cite: 10]
      let offerSdp = incomingCallData.offer;
      if (!offerSdp) {
        const offerRes = await callService.getCallOffer(callId);
        offerSdp = offerRes.data.offer_sdp;
      }

      await peerConn.setRemoteDescription(new RTCSessionDescription(offerSdp));

      // Step 3: Create & Set SDP Answer
      const answer = await peerConn.createAnswer();
      await peerConn.setLocalDescription(answer);

      // Step 4: Transmit answer to backend[cite: 5]
      await callService.receiveCall(callId, {
        sdp: answer.sdp,
        type: answer.type,
      });

      setCallState('IN_CALL');

      // Step 5: Listen to call status changes
      const callDocRef = doc(db, 'call_history', callId);
      unsubCallDoc.current = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data && ['Rejected', 'Call Completed'].includes(data.call_status)) {
          terminateCallSession(false);
        }
      });

      // Step 6: Listen for Caller's ICE candidates[cite: 8]
      const offerCandidatesRef = collection(db, 'call_history', callId, 'offerCandidates');
      unsubCandidates.current = onSnapshot(offerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            try {
              if (peerConn.remoteDescription) {
                await peerConn.addIceCandidate(new RTCIceCandidate(candidateData));
              }
            } catch (e) {
              console.warn('Error adding offer ICE candidate:', e);
            }
          }
        });
      });
    } catch (err) {
      console.error('Accept call error:', err);
      setCallError(err.response?.data?.error || err.message || 'Failed to accept call');
      terminateCallSession(false);
    }
  };

  // -------------------------------------------------------------
  // CALLEE: Reject Call[cite: 6]
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // End Call[cite: 9]
  // -------------------------------------------------------------
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