import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { showErrorToast } from "../../utils/errorHandler";
import {
  cancelAppointmentAPI,
  getAppointmentsAPI,
} from "../../services/appointmentServices";
import { toast } from "react-toastify";
import type { AppointmentTypes } from "../../types/appointment";
import {
  PaymentRazorpayAPI,
  VerifyRazorpayAPI,
} from "../../services/paymentServices";
import type {
  RazorpayOptions,
  RazorpayPaymentResponse,
} from "../../types/razorpay";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, User, CreditCard, X, CheckCircle, AlertCircle, Video } from "lucide-react";

const MyAppointments = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("MyAppointments must be used within an AppContextProvider");
  }

  const { token, getDoctorsData, slotDateFormat } = context;

  const [appointments, setAppointments] = useState<AppointmentTypes[]>([]);

  const navigate = useNavigate();

  if (!token) {
    toast.error("Please login to continue...");
    return;
  }

  const getUserAppointments = async () => {
    try {
      const { data } = await getAppointmentsAPI(token);

      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { data } = await cancelAppointmentAPI(appointmentId, token);

      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const initPay = (
    order: { id: string; amount: number; currency: string; receipt?: string },
    appointmentId: string
  ) => {
    const options: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Appointment Payment",
      description: "Appointment Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response: RazorpayPaymentResponse) => {
        console.log(response);

        try {
          const { data } = await VerifyRazorpayAPI(
            appointmentId,
            response,
            token
          );

          if (data.success) {
            console.log(appointmentId);
            toast.success(data.message);
            getUserAppointments();
            navigate("/my-appointments");
          }
        } catch (error) {
          showErrorToast(error);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const appointmentRazorpay = async (appointmentId: string) => {
    try {
      const { data } = await PaymentRazorpayAPI(appointmentId, token);

      if (data.success) {
        initPay(data.order, appointmentId);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token]);

  const getStatusBadge = (appointment: AppointmentTypes) => {
    if (appointment.cancelled) {
      return (
        <div className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          <X className="w-4 h-4 mr-1" />
          Cancelled
        </div>
      );
    }
    if (appointment.payment) {
      return (
        <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4 mr-1" />
          Paid
        </div>
      );
    }
    return (
      <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
        <AlertCircle className="w-4 h-4 mr-1" />
        Pending Payment
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage and track your upcoming consultations</p>
        </div>

        {/* Appointments List */}
        <div className="space-y-6">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/30">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Appointments Found</h3>
                <p className="text-gray-500">You don't have any appointments scheduled yet.</p>
              </div>
            </div>
          ) : (
            appointments.map((item, index) => (
              <div
            key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Doctor Image */}
                    <div className="flex-shrink-0">
                      <div className="relative">
              <img
                          className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-lg"
                src={item.docData.image}
                          alt={item.docData.name}
              />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
            </div>

                    {/* Doctor Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-800">{item.docData.name}</h3>
                            {getStatusBadge(item)}
            </div>

                          <p className="text-primary font-semibold mb-3">{item.docData.speciality}</p>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span>{item.docData.address.line1}</span>
                            </div>
                            {item.docData.address.line2 && (
                              <div className="flex items-center gap-2 ml-6">
                                <span>{item.docData.address.line2}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{slotDateFormat(item.slotDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{item.slotTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 sm:items-end">
              {!item.cancelled && item.payment && (
                <button
                  onClick={() => navigate(`/consultation/${item.docData._id}`)}
                              className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              <Video className="w-4 h-4" />
                              Start Consultation
                </button>
              )}

              {!item.cancelled && !item.payment && (
                <button
                  onClick={() => appointmentRazorpay(item._id!)}
                              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                              <CreditCard className="w-4 h-4" />
                              Pay Now
                </button>
              )}

              {!item.cancelled && (
                <button
                  onClick={() => cancelAppointment(item._id!)}
                              className="flex items-center gap-2 bg-white border-2 border-red-500 text-red-500 px-6 py-3 rounded-xl font-semibold hover:bg-red-500 hover:text-white transition-all duration-300"
                >
                              <X className="w-4 h-4" />
                              Cancel Appointment
                </button>
              )}
            </div>
          </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;
