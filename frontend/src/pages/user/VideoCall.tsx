import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { submitFeedbackAPI, createPrescriptionAPI, completeAppointmentAPI } from "../../services/appointmentServices";
import { useSocket } from "../../context/SocketContext";

const VideoCall = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { socket, isConnected, joinConversation, leaveConversation, sendCallInvite, sendCallAnswer, sendCallCandidate, sendCallEnd } = useSocket();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const screenShareTrackRef = useRef<MediaStreamTrack | null>(null);
  const callTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);
    // If doctor accepted via modal, an incoming offer may be present
    try {
      const raw = sessionStorage.getItem('incomingOffer');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.conversationId === conversationId && parsed?.offer) {
          // Simulate receiving invite to proceed as callee
          (async () => {
            await ensureConnection();
            await ensureLocalMedia();
            await pcRef.current?.setRemoteDescription(new RTCSessionDescription(parsed.offer));
            const answer = await pcRef.current?.createAnswer();
            await pcRef.current?.setLocalDescription(answer!);
            sendCallAnswer(conversationId, answer);
            setInCall(true);
            sessionStorage.removeItem('incomingOffer');
          })();
        }
      }
    } catch {}
    return () => {
      leaveConversation(conversationId);
      cleanup();
    };
  }, [conversationId]);

  useEffect(() => {
    if (!socket) return;
    const onInvite = async (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      // If this client initiated the call, ignore the mirrored invite
      const initiator = sessionStorage.getItem('callInitiator');
      if (initiator === 'self') return;
      await ensureConnection();
      await ensureLocalMedia();
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pcRef.current?.createAnswer();
      await pcRef.current?.setLocalDescription(answer!);
      sendCallAnswer(payload.conversationId, answer);
      setInCall(true);
    };
    const onAnswer = async (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(payload.answer));
      setInCall(true);
    };
    const onCandidate = async (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.candidate) {
        try {
          await pcRef.current?.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error("Failed to add ICE candidate", e);
        }
      }
    };
    const onEnd = () => {
      toast.info("Call ended");
      cleanup();
      setInCall(false);
      try {
        const roleHint = sessionStorage.getItem('roleForCall');
        if (roleHint === 'doctor') setShowRx(true);
        else setShowFeedback(true);
      } catch {
        setShowFeedback(true);
      }
    };

    socket.on("call_invite", onInvite);
    socket.on("call_answer", onAnswer);
    socket.on("call_candidate", onCandidate);
    socket.on("call_end", onEnd);
    return () => {
      socket.off("call_invite", onInvite);
      socket.off("call_answer", onAnswer);
      socket.off("call_candidate", onCandidate);
      socket.off("call_end", onEnd);
    };
  }, [socket, conversationId]);

  const ensureConnection = async () => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] });
    pc.onicecandidate = (e) => {
      if (e.candidate && conversationId) {
        sendCallCandidate(conversationId, e.candidate);
      }
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };
    pcRef.current = pc;
    return pc;
  };

  const ensureLocalMedia = async () => {
    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((t) => pcRef.current?.addTrack(t, stream));
    }
  };

  const startCall = async () => {
    try {
      if (!conversationId) return;
      await ensureConnection();
      await ensureLocalMedia();
      const offer = await pcRef.current?.createOffer();
      await pcRef.current?.setLocalDescription(offer!);
      // Read optional target from session (doctor/user) to ensure personal room delivery
      let target: { id: string; type: 'user' | 'doctor' } | undefined = undefined;
      try {
        const raw = sessionStorage.getItem("callTarget");
        if (raw) target = JSON.parse(raw);
      } catch {}
      // Mark this client as initiator to avoid handling their own invite
      sessionStorage.setItem('callInitiator', 'self');
      sendCallInvite(conversationId, offer, target);
      if (callTimerRef.current) window.clearInterval(callTimerRef.current);
      callTimerRef.current = window.setInterval(() => setCallSeconds((s) => s + 1), 1000);
    } catch (e: any) {
      toast.error(e?.message || "Failed to start call");
    }
  };

  const endCall = () => {
    if (conversationId) sendCallEnd(conversationId, "hangup");
    cleanup();
    setInCall(false);
    try {
      sessionStorage.removeItem('callInitiator');
      sessionStorage.removeItem('incomingOffer');
      sessionStorage.removeItem('callTarget');
      // keep roleForCall for post-call modal decision
    } catch {}
    const roleHint = sessionStorage.getItem('roleForCall');
    if (roleHint === 'doctor') setShowRx(true); else setShowFeedback(true);
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks?.()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks?.()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCamOff(!track.enabled);
    }
  };

  const startScreenShare = async () => {
    try {
      if (!pcRef.current) return;
      const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      const screenTrack: MediaStreamTrack = displayStream.getVideoTracks()[0];
      screenShareTrackRef.current = screenTrack;
      const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
      setIsScreenSharing(true);
      screenTrack.onended = async () => {
        await stopScreenShare();
      };
    } catch (e: any) {
      toast.error(e?.message || 'Unable to share screen');
    }
  };

  const stopScreenShare = async () => {
    try {
      if (!pcRef.current) return;
      const camTrack = localStreamRef.current?.getVideoTracks?.()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (camTrack && sender) await sender.replaceTrack(camTrack);
      if (screenShareTrackRef.current) screenShareTrackRef.current.stop();
    } finally {
      setIsScreenSharing(false);
      screenShareTrackRef.current = null;
    }
  };

  const cleanup = () => {
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    localStreamRef.current = null;
    try {
      pcRef.current?.getSenders().forEach((s) => pcRef.current?.removeTrack(s));
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (callTimerRef.current) {
      window.clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallSeconds(0);
    setIsMuted(false);
    setIsCamOff(false);
    setIsScreenSharing(false);
  };

  // Feedback (user) & Prescription (doctor) modals
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [showRx, setShowRx] = useState(false);
  const [rxItems, setRxItems] = useState<{ name: string; dosage: string; instructions?: string }[]>([
    { name: "", dosage: "", instructions: "" },
  ]);
  const [rxNotes, setRxNotes] = useState("");

  useEffect(() => {
    // Decide which modal to show based on role stored in token payload
    try {
      const token = localStorage.getItem('doctorAccessToken');
      if (token) {
        setShowRx(false); // open after endCall on doctor side manually
      }
    } catch {}
  }, []);


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="text-white/90 font-semibold">Secure Consultation</div>
          <div className="text-white/70 text-sm tabular-nums">
            {new Date(callSeconds * 1000).toISOString().substring(11, 19)}
          </div>
        </div>
        <div className="relative">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full aspect-video bg-black" />
          <div className="absolute bottom-4 right-4">
            <div className="w-48 h-28 rounded-lg overflow-hidden ring-2 ring-white/60 shadow-lg bg-black">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800/60 border-t border-white/10">
          {!inCall ? (
            <button onClick={startCall} disabled={!isConnected} className="px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 shadow">
              Start Call
            </button>
          ) : (
            <>
              <button onClick={toggleMute} className={`px-4 py-3 rounded-full ${isMuted ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} shadow`}>
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={toggleCamera} className={`px-4 py-3 rounded-full ${isCamOff ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} shadow`}>
                {isCamOff ? 'Camera On' : 'Camera Off'}
              </button>
              {!isScreenSharing ? (
                <button onClick={startScreenShare} className="px-4 py-3 rounded-full bg-white text-slate-900 shadow">Share Screen</button>
              ) : (
                <button onClick={stopScreenShare} className="px-4 py-3 rounded-full bg-slate-700 text-white shadow">Stop Share</button>
              )}
              <button onClick={endCall} className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow">
                End
              </button>
            </>
          )}
        </div>
      </div>

      {showFeedback && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">Rate your consultation</h3>
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className={s <= rating ? 'text-amber-500 text-2xl' : 'text-gray-300 text-2xl'}>★</button>
              ))}
            </div>
            <textarea value={comment} onChange={(e)=>setComment(e.target.value)} className="w-full border rounded-lg p-3 h-28 mb-4" placeholder="Your feedback"/>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-lg border" onClick={()=>setShowFeedback(false)}>Close</button>
              <button className="px-4 py-2 rounded-lg bg-primary text-white" onClick={async()=>{
                try{
                  const apptId = sessionStorage.getItem('activeAppointmentId') || '';
                  if (!apptId) throw new Error('Appointment not found');
                  await submitFeedbackAPI(apptId, rating, comment);
                  toast.success('Feedback submitted');
                  setShowFeedback(false);
                }catch(e:any){toast.error(e?.response?.data?.message||'Failed');}
              }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {showRx && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Add Prescription</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {rxItems.map((it,idx)=> (
                <div key={idx} className="grid grid-cols-3 gap-2">
                  <input value={it.name} onChange={(e)=>{const n=[...rxItems]; n[idx].name=e.target.value; setRxItems(n);}} className="border rounded p-2" placeholder="Medicine"/>
                  <input value={it.dosage} onChange={(e)=>{const n=[...rxItems]; n[idx].dosage=e.target.value; setRxItems(n);}} className="border rounded p-2" placeholder="Dosage"/>
                  <input value={it.instructions} onChange={(e)=>{const n=[...rxItems]; n[idx].instructions=e.target.value; setRxItems(n);}} className="border rounded p-2" placeholder="Instructions"/>
                </div>
              ))}
              <button className="text-sm text-blue-600" onClick={()=>setRxItems([...rxItems,{name:'',dosage:'',instructions:''}])}>+ Add item</button>
              <textarea value={rxNotes} onChange={(e)=>setRxNotes(e.target.value)} className="w-full border rounded-lg p-3 h-24" placeholder="Notes"/>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 rounded-lg border" onClick={()=>setShowRx(false)}>Close</button>
              <button className="px-4 py-2 rounded-lg bg-primary text-white" onClick={async()=>{
                try{
                  const apptId = sessionStorage.getItem('activeAppointmentId') || '';
                  if (!apptId) throw new Error('Appointment not found');
                  await createPrescriptionAPI(apptId, '', rxItems, rxNotes);
                  await completeAppointmentAPI(apptId);
                  toast.success('Prescription saved and appointment completed');
                  setShowRx(false);
                }catch(e:any){toast.error(e?.response?.data?.message||'Failed');}
              }}>Save & Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;


