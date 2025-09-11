import { getApi } from "../axios/axiosInstance";
const api = getApi("user");
import { PAYMENT_API } from "../constants/apiRoutes";
import type { RazorpayPaymentResponse } from "../types/razorpay";


export const PaymentRazorpayAPI = async (
  docId: string,
  slotDate: string,
  slotTime: string,
  appointmentId: string,
  token: string
) => {
  return api.post(
    '/api/user/appointments/initiate',
    { docId, slotDate, slotTime, appointmentId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Verify Razorpay payment signature
export const VerifyRazorpayAPI = async (
  appointmentId: string,
  response: RazorpayPaymentResponse,
  token: string
) => {
  return api.post(
    PAYMENT_API.RAZORPAY_VERIFY,
    {
      appointmentId,
      razorpay_order_id: response.razorpay_order_id,
    },
    {}
  );
};
