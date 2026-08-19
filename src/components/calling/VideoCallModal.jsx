// src/components/calling/VideoCallModal.jsx

import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import { PhoneOff } from '../ui/Icons';

const formatSeconds = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function VideoCallModal() {
  const {
    callState,
    localStream,
    remoteStream,
    activeCallDetails,
    isAudioMuted,
    isVideoDisabled,
    isScreenSharing,
    callDuration,
    callError,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
  }, [localStream.current, callState]);

  useEffect(() => {
    const attachRemote = () => {
      if (remoteVideoRef.current && remoteStream.current) {
        remoteVideoRef.current.srcObject = remoteStream.current;
      }
    };
    attachRemote();
    const interval = setInterval(attachRemote, 1000);
    return () => clearInterval(interval);
  }, [remoteStream.current, callState]);

  if (!['CONNECTING', 'RINGING_OUT', 'IN_CALL'].includes(callState)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between text-white bg-slate-900/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h4 className="text-sm font-extrabold text-slate-100">
            {activeCallDetails?.call_to_user || activeCallDetails?.call_from_user || 'Consultation Room'}
          </h4>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {callState === 'RINGING_OUT' && 'Ringing...'}
            {callState === 'CONNECTING' && 'Connecting WebRTC...'}
            {callState === 'IN_CALL' && `Connected (${formatSeconds(callDuration)})`}
          </span>
        </div>

        {callError && (
          <span className="text-xs text-rose-400 font-bold bg-rose-950/60 px-3 py-1 rounded-lg border border-rose-800">
            {callError}
          </span>
        )}
      </div>

      {/* Video Viewport Matrix */}
      <div className="flex-1 relative my-4 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-3xl"
        />

        {callState !== 'IN_CALL' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm text-center p-4">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-200 text-sm font-bold">
              {callState === 'RINGING_OUT' ? 'Waiting for participant to pick up...' : 'Connecting video stream...'}
            </p>
          </div>
        )}

        {/* Local Picture-in-Picture Video */}
        <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-48 sm:h-36 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : 'block'}`}
          />
          {isVideoDisabled && (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-extrabold text-xs uppercase bg-slate-900">
              Camera Off
            </div>
          )}
        </div>
      </div>

      {/* Media Controller Bar */}
      <div className="flex items-center justify-center gap-4 bg-slate-900/90 backdrop-blur-md py-3 px-6 rounded-2xl border border-slate-800 max-w-md mx-auto shadow-xl">
        <button
          type="button"
          onClick={toggleAudio}
          className={`p-3.5 rounded-2xl transition font-bold text-xs ${
            isAudioMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isAudioMuted ? '🔇 Mic Off' : '🎙️ Mic On'}
        </button>

        <button
          type="button"
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl transition font-bold text-xs ${
            isVideoDisabled ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoDisabled ? '📷 Cam Off' : '📹 Cam On'}
        </button>

        <button
          type="button"
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl transition font-bold text-xs ${
            isScreenSharing ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title="Share Screen"
        >
          {isScreenSharing ? '🖥️ Stop Share' : '💻 Share'}
        </button>

        <button
          type="button"
          onClick={endCall}
          className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl transition shadow-lg flex items-center gap-1.5 font-bold text-xs"
          title="End Consultation"
        >
          <PhoneOff className="w-4 h-4" /> End
        </button>
      </div>
    </div>
  );
}