import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AppContext } from "../../context/AppContext";
import { assets, type Doctor } from "../../assets/user/assets";
import RelatedDoctors from "../../components/user/RelatedDoctors";
import { toast } from "react-toastify";
import {
  appointmentBookingAPI,
  getAvailableSlotsAPI,
} from "../../services/appointmentServices";
import { showErrorToast } from "../../utils/errorHandler";
import { Star, Clock, MapPin, Users, Calendar, CheckCircle } from "lucide-react";

function parse12HourTime(timeStr: string): { hour: number; minute: number } {
  const [time, modifier] = timeStr.split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (modifier.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (modifier.toUpperCase() === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

// Helper to format date as YYYY-MM-DD in local time
function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const Appointment = () => {
  type TimeSlot = {
    datetime: Date;
    time: string;
  };

  const navigate = useNavigate();
  const { docId } = useParams();
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext missing");

  const { doctors, currencySymbol, token, getDoctorsData,authLoading } = context;
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const [docInfo, setDocInfo] = useState<Doctor | undefined | null>(null);
  const [docSlots, setDocSlots] = useState<TimeSlot[][]>([]);
  const [slotIndex, setSlotIndex] = useState<number>(0);
  const [slotTime, setSlotTime] = useState<string>("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  

  const fetchDocInfo = () => {
    const doc = doctors.find((doc) => doc._id === docId);
    setDocInfo(doc);
  };

  const getAvailableSlots = async () => {
    setDocSlots([]);
    if (!docId) return;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    try {
      const slotsArray = await getAvailableSlotsAPI(docId, year, month);

    // Group slots by date for the UI
    const slotMap: Record<string, any[]> = {};
    slotsArray.forEach((slot: any) => {
      if (!slot.isCancelled) {
        if (!slotMap[slot.date]) slotMap[slot.date] = [];
        slotMap[slot.date].push(slot);
      }
    });

    const weekSlots: TimeSlot[][] = [];
    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateKey = formatLocalDate(currentDate);
      const slots = slotMap[dateKey] || [];

      const timeSlots: TimeSlot[] = slots.map((slot) => {
       
        const [hour, minute] = slot.start.split(":").map(Number);
        const slotDate = new Date(currentDate);
        slotDate.setHours(hour);
        slotDate.setMinutes(minute);
        return {
          datetime: slotDate,
          time: slot.start,
        };
        });

        weekSlots.push(timeSlots);
      }

      setDocSlots(weekSlots);
      setSlotIndex(0);
      setShowCustomDatePicker(false);
    } catch (err: any) {
      toast.error("Failed to load available slots");
    }
  };

  const fetchSlotsForCustomDate = async (date: Date) => {
    if (!docId) return;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const slotDateStr = formatLocalDate(date);

    try {
      const slotArray = await getAvailableSlotsAPI(docId, year, month);
      const matched = slotArray.find((item: any) => item.date === slotDateStr);
      const timeSlots = matched?.slots
        ?.filter((slot: any) => !slot.booked)
        .map((slot: any) => {
          const { hour, minute } = parse12HourTime(slot.start);
          const dt = new Date(date);
          dt.setHours(hour);
          dt.setMinutes(minute);
          return { datetime: dt, time: slot.start };
        }) || [];

      setDocSlots([timeSlots]);
      setSlotIndex(0);
    } catch {
      toast.error("Failed to fetch custom date slots");
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warn("Login to book appointment");
      return navigate("/login");
    }

    const selectedSlot = docSlots[slotIndex]?.find(s => s.time === slotTime);
    if (!selectedSlot) {
      toast.error("No slot selected");
      return;
    }

    const date = selectedSlot.datetime;
    const slotDate = formatLocalDate(date);

    try {
      const { data } = await appointmentBookingAPI(docId!, slotDate, slotTime, token);
      if (data.success) {
        toast.success(data.message);
        getDoctorsData();
        navigate("/my-appointments");
      } else toast.error(data.message);
    } catch (err) {
      showErrorToast(err);
    }
  };

  useEffect(() => {
    if(!authLoading){
    getDoctorsData();
    
    }
  }, [authLoading]);

  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    getAvailableSlots();
  }, [docInfo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Doctor Info Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-80">
            <div className="relative">
              <img
                className="w-full h-80 object-cover rounded-xl shadow-lg"
                src={docInfo?.image}
                alt={docInfo?.name}
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center shadow-lg">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="text-sm font-semibold text-gray-800">4.{Math.floor(Math.random() * 3) + 7}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {docInfo?.name}
              </h1>
              <img className="w-6 h-6" src={assets.verified_icon} alt="Verified" />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-lg font-semibold text-primary">
                {docInfo?.degree} - {docInfo?.speciality}
              </span>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {docInfo?.experience} Experience
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                About Doctor
              </h3>
              <p className="text-gray-600 leading-relaxed">{docInfo?.about}</p>
            </div>
            
            <div className="bg-gradient-to-r from-primary/10 to-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Appointment Fee:</span>
                <span className="text-2xl font-bold text-primary">
                  {currencySymbol}{docInfo?.fees}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-primary" />
            Book Your Appointment
          </h2>
          <p className="text-gray-600">Select your preferred date and time slot</p>
        </div>

        {/* Date Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Date</h3>
          <div className="flex gap-3 items-center w-full overflow-x-auto pb-2">
            {docSlots.map((item, index) => {
              const isAvailable = item.length > 0;
              // Calculate the date for this index
              const today = new Date();
              const currentDate = new Date(today);
              currentDate.setDate(today.getDate() + index);
              const dayLabel = daysOfWeek[currentDate.getDay()];
              const dateLabel = currentDate.getDate();
              return (
                <div
                  key={index}
                  onClick={isAvailable ? () => {
                    setSlotIndex(index);
                    setShowCustomDatePicker(false);
                  } : undefined}
                  className={`text-center py-4 px-6 min-w-20 rounded-xl transition-all duration-300 shadow-sm select-none ${
                    isAvailable
                      ? `cursor-pointer ${slotIndex === index && !showCustomDatePicker
                        ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg transform scale-105"
                        : "bg-white border-2 border-gray-200 hover:border-primary/50 hover:shadow-md"}`
                      : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-70 border-2 border-gray-200"
                  }`}
                  tabIndex={-1}
                >
                  <p className="text-sm font-medium">{dayLabel}</p>
                  <p className="text-lg font-bold">{dateLabel}</p>
                  {!isAvailable && (
                    <span className="block text-xs mt-1">Not Available</span>
                  )}
                </div>
              );
            })}

            {/* Calendar Selector */}
            <div
              onClick={() => {
                if (showCustomDatePicker) {
                  getAvailableSlots();
                  setCustomDate(null);
                } else {
                  setShowCustomDatePicker(true);
                }
              }}
              className={`text-center py-4 px-6 min-w-20 rounded-xl cursor-pointer transition-all duration-300 shadow-sm ${
                showCustomDatePicker 
                  ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg transform scale-105" 
                  : "bg-white border-2 border-gray-200 hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <Calendar className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs font-medium">{showCustomDatePicker ? "Back" : "More"}</p>
            </div>
          </div>

          {showCustomDatePicker && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <DatePicker
                selected={customDate}
                onChange={(date) => {
                  if (date) {
                    setCustomDate(date);
                    fetchSlotsForCustomDate(date);
                  }
                }}
                minDate={new Date()}
                className="border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-primary focus:outline-none w-full"
                placeholderText="Select a future date"
              />
            </div>
          )}
        </div>

        {/* Time Slot Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Select Time Slot
          </h3>
          <div className="flex items-center gap-3 w-full overflow-x-auto pb-2">
            {docSlots[slotIndex]?.length > 0 ? (
              docSlots[slotIndex].map((item, index) => (
                <button
                  onClick={() => setSlotTime(item.time)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex-shrink-0 shadow-sm ${
                    item.time === slotTime
                      ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg transform scale-105"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary/50 hover:shadow-md"
                  }`}
                  key={index}
                >
                  {item.time.toLowerCase()}
                </button>
              ))
            ) : (
              <div className="text-center py-8 w-full">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No available slots for this date</p>
              </div>
            )}
          </div>
        </div>

        {/* Book Appointment Button */}
        <div className="text-center">
          <button
            onClick={bookAppointment}
            disabled={!slotTime}
            className={`px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
              slotTime
                ? "bg-gradient-to-r from-primary to-blue-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Appointment;
