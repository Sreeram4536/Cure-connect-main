import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DoctorContext } from "../../context/DoctorContext";
import { resendDoctorOtpAPI, verifyDoctorOtpAPI } from "../../services/doctorServices";

const DoctorOtpVerificationPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const context = useContext(DoctorContext);

  if (!context) {
    throw new Error("DoctorOtpVerificationPage must be used within a DoctorContextProvider");
  }

  const { dToken } = context;

  useEffect(() => {
    const tempDoctor = JSON.parse(localStorage.getItem("tempDoctorData") || "{}");
    if (!tempDoctor?.email || !tempDoctor?.purpose) {
      navigate("/doctor/login");
    } else {
      setEmail(tempDoctor.email);
      setPurpose(tempDoctor.purpose);
    }
  }, []);

  useEffect(() => {
    let interval: any;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      // Auto focus next
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }

    try {
      const { data } = await verifyDoctorOtpAPI(email, enteredOtp);

      if (data.success) {
        if (purpose === "reset-password") {
          toast.success("OTP verified successfully");
          navigate("/doctor/reset-password");
        }
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to verify OTP");
    }
  };

  const resendOtp = async () => {
    try {
      const { data } = await resendDoctorOtpAPI(email);

      if (data.success) {
        toast.success("OTP resent to email");
        setTimer(60); // restart timer
        setCanResend(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to resend OTP");
    }
  };

  useEffect(() => {
    if (dToken) {
      navigate("/doctor/dashboard");
    }
  });

  return (
    <form className="min-h-[80vh] flex items-center" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
        <p className="text-2xl font-semibold">Enter Verification Code</p>
        <p>We've sent a 6-digit code to {email}</p>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Verification Code</label>
          <div className="flex items-center space-x-3 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                maxLength={1}
                className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
              />
            ))}
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}
        </div>

        <button
          type="submit"
          className="bg-primary text-white w-full py-2 rounded-md text-base"
        >
          Verify Code
        </button>
        <p>
          Didn't receive a code?
          <span
            className={`text-blue-500 cursor-pointer ${
              !canResend ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={canResend ? resendOtp : undefined}
          >
            Resend {canResend ? "" : `in ${timer}s`}
          </span>
        </p>
      </div>
    </form>
  );
};

export default DoctorOtpVerificationPage;

