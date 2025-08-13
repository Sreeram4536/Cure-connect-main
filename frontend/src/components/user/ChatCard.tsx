import React, { useState, useEffect } from "react";
import { assets } from "../../assets/user/assets";
import { useNavigate } from "react-router-dom";
import { createConversationAPI } from "../../services/chatServices";
import { toast } from "react-toastify";
import { api } from "../../axios/axiosInstance";

type ChatCardProps = {
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorImage?: string;
};

interface DoctorInfo {
  name: string;
  speciality: string;
  image: string;
}

const ChatCard: React.FC<ChatCardProps> = ({ 
  doctorId, 
  doctorName: propDoctorName,
  doctorSpecialization: propDoctorSpecialization,
  doctorImage: propDoctorImage
}) => {
  console.log("ChatCard received doctorId:", doctorId);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);

  // Fetch doctor information when doctorId changes
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!doctorId) return;
      
      setLoadingDoctor(true);
      try {
        const response = await api.get(`/api/user/doctor/${doctorId}`);
        if (response.data.success) {
          setDoctorInfo(response.data.doctor);
        }
      } catch (error) {
        console.error("Error fetching doctor info:", error);
        // Fallback to props if API fails
        if (propDoctorName && propDoctorSpecialization) {
          setDoctorInfo({
            name: propDoctorName,
            speciality: propDoctorSpecialization,
            image: propDoctorImage || assets.contact_image
          });
        }
      } finally {
        setLoadingDoctor(false);
      }
    };

    fetchDoctorInfo();
  }, [doctorId, propDoctorName, propDoctorSpecialization, propDoctorImage]);

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

  // Use fetched doctor info or fallback to props
  const displayName = doctorInfo?.name || propDoctorName || "Dr. Sarah Johnson";
  const displaySpecialization = doctorInfo?.speciality || propDoctorSpecialization || "Cardiologist";
  const displayImage = doctorInfo?.image || propDoctorImage || assets.contact_image;

  return (
    <div className="w-96 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Card Header with Image */}
      <div className="h-96 overflow-hidden">
        <img
          src={displayImage}
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
          Start a conversation with {displayName} ({displaySpecialization})
        </p>
        {loadingDoctor && (
          <div className="mt-2 text-sm text-blue-600">
            Loading doctor information...
          </div>
        )}
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
