import React, { useEffect, useState } from "react";
import DoctorSidebar from "../components/doctor/DoctorSidebar";
import DoctorNavbar from "../components/doctor/DoctorNavbar";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const DoctorLayout = ({ children }: { children: React.ReactNode }) => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState<{ 
    open: boolean; 
    conversationId: string | null; 
    fromType?: string; 
    offer?: any;
    appointmentId?: string;
    userId?: string;
  }>({ open: false, conversationId: null });

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: any) => {
      const { conversationId, fromType, offer, appointmentId, userId } = payload || {};
      if (!conversationId) return;
      setIncomingCall({ open: true, conversationId, fromType, offer, appointmentId, userId });
    };
    socket.on('call_invite', handler);
    return () => {
      socket.off('call_invite', handler);
    };
  }, [socket]);

  return (
    <div className="mx-4 sm:mx=[10%]">
      <DoctorNavbar />
      <div className="flex">
        <DoctorSidebar />
        <div className="flex-1">{children}</div>
      </div>

      {incomingCall.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">Incoming Call</h3>
            <p className="text-gray-600 mb-6">Patient is calling. Join now?</p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300"
                onClick={() => setIncomingCall({ open: false, conversationId: null })}
              >
                Decline
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-white"
                onClick={() => {
                  if (incomingCall.conversationId) {
                    // Store appointment ID and user ID in session storage for prescription functionality
                    if (incomingCall.appointmentId) {
                      sessionStorage.setItem('activeAppointmentId', incomingCall.appointmentId);
                    }
                    if (incomingCall.userId) {
                      sessionStorage.setItem('callUserId', incomingCall.userId);
                    }
                    
                    // Persist the incoming offer so call page can answer immediately
                    try {
                      sessionStorage.setItem(
                        'incomingOffer',
                        JSON.stringify({
                          conversationId: incomingCall.conversationId,
                          offer: incomingCall.offer,
                        })
                      );
                    } catch {}
                    navigate(`/call/${incomingCall.conversationId}`);
                  }
                  setIncomingCall({ open: false, conversationId: null });
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorLayout;
