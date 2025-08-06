import React from "react";
import VideoCallCard from "../../components/user/VideoCallCard";
import ChatCard from "../../components/user/ChatCard";
import { useParams } from "react-router-dom";

const Consultation = () => {
  const { doctorId } = useParams();

  console.log("Consultation page received doctorId:", doctorId);

  return (
    <div className="flex place-items-center justify-center gap-6 p-8">
      <VideoCallCard />
      <ChatCard 
        doctorId={doctorId} 
        doctorName="Dr. Sarah Johnson"
        doctorSpecialization="Cardiologist"
        doctorImage="https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=400&h=400&fit=crop&crop=face"
      />
    </div>
  );
};

export default Consultation;
