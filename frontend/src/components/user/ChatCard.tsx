import React, { useState, useEffect } from "react";
import { assets } from "../../assets/user/assets";
import { useNavigate } from "react-router-dom";
import { createConversationAPI } from "../../services/chatServices";
import { toast } from "react-toastify";

type ChatCardProps = {
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorImage?: string;
};

const ChatCard: React.FC<ChatCardProps> = ({ 
  doctorId, 
  doctorName = "Dr. Sarah Johnson",
  doctorSpecialization = "Cardiologist",
  doctorImage 
}) => {
  console.log("ChatCard received doctorId:", doctorId);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    if (!doctorId) {
      toast.error("Doctor ID is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await createConversationAPI(doctorId);
      if (response.data.success) {
        toast.success("Chat started successfully!");
        navigate(`/chats/${doctorId}`);
      }
    } catch (error: any) {
      console.error("Error starting chat:", error);
      toast.error(error.response?.data?.message || "Failed to start chat");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-96 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Card Header with Image */}
      <div className="h-96 overflow-hidden">
        <img
          src={doctorImage || assets.contact_image}
          alt="card-image"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Card Body */}
      <div className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-blue-gray-900 font-medium text-lg">
            Start Messaging
          </h3>
          <span className="text-blue-gray-900 font-medium text-lg">
            <img className="h-10 w-10" src={assets.message_icon} alt="" />
          </span>
        </div>
        <p className="text-gray-600 text-sm font-normal opacity-75 leading-relaxed">
          Start a conversation with {doctorName} ({doctorSpecialization})
        </p>
      </div>

      {/* Card Footer */}
      <div className="px-6 pb-6 pt-0">
        <button
          onClick={handleStartChat}
          disabled={isLoading || !doctorId}
          className="w-full bg-primary hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 focus:scale-105 active:scale-100 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Starting Chat...
            </div>
          ) : (
            "Start Chat"
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatCard;
