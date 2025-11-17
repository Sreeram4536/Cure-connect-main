// src/pages/doctor/DoctorLogin.tsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DoctorContext } from "../../context/DoctorContext";
import { doctorLoginAPI } from "../../services/doctorServices";
import { showErrorToast } from "../../utils/errorHandler";
import { assets } from "../../assets/user/assets";
import { updateDoctorAccessToken } from "../../context/tokenManagerDoctor";


const DoctorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const context = useContext(DoctorContext);

  if (!context) {
    throw new Error("DoctorContext must be used within DoctorContextProvider");
  }

  const { dToken, setDToken, loading } = context;

  // Test context functionality
  useEffect(() => {
    console.log("DoctorLogin: Context test - dToken:", dToken);
    console.log("DoctorLogin: Context test - setDToken type:", typeof setDToken);
    console.log("DoctorLogin: Context test - loading:", loading);
  }, [dToken, setDToken, loading]);

  // Redirect to dashboard if already logged in and not loading
  useEffect(() => {
    if (!loading && dToken) {
      console.log("DoctorLogin: Already logged in, redirecting to dashboard");
      navigate("/doctor/dashboard");
    }
  }, [dToken, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      console.log("Doctor login: Attempting login with email:", email);
      console.log("Doctor login: Context available:", !!context);
      console.log("Doctor login: setDToken function:", typeof setDToken);
      
      const { data } = await doctorLoginAPI(email, password);
      console.log("Doctor login: API response:", data);
      if (data.success) {
        console.log("Doctor login: Login successful, setting token:", data.accessToken);
        updateDoctorAccessToken(data.accessToken);
        console.log("Doctor login: About to call setDToken");
        setDToken(data.accessToken);
        console.log("Doctor login: setDToken called successfully");
        localStorage.removeItem("isDoctorLoggedOut");
        toast.success("Login successful");
        console.log("Doctor login: Navigating to dashboard");
        // Add a small delay to ensure token is set and context is updated
        setTimeout(() => {
          console.log("Doctor login: Delayed navigation to dashboard");
          navigate("/doctor/dashboard");
        }, 200);
      } else {
        console.error("Doctor login: Login failed:", data.message);
        toast.error(data.message);
      }
    } catch (error:any) {
      console.error("Doctor login: Error during login:", error);
      if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message;
    const code = error.response.data?.code;

    // Doctor is blocked
    if (status === 403 && code === "DOCTOR_BLOCKED") {
      toast.error("Your account is blocked. Please contact admin.");
      return;
    }
  }
      showErrorToast(error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form onSubmit={handleSubmit}>
        <div
  className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-600 font-medium shadow-md hover:bg-blue-200 transition duration-300 cursor-pointer"
  onClick={() => navigate("/")}
>
  <span className="text-lg">🏠</span>
  <span className="text-sm sm:text-base">Back to Home</span>
</div>
        <div className="flex flex-col sm:flex-row bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="hidden sm:block w-full sm:w-96">
            <img
              src={assets.about_image}
              alt="Doctor Login Visual"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-3 p-8 min-w-[340px] sm:min-w-96 text-[#5E5E5E] text-sm">
            <p className="text-2xl font-semibold m-auto text-primary">
              Doctor Login
            </p>

            <div className="w-full">
              <p>Email</p>
              <input
                type="email"
                required
                className="border border-[#DADADA] rounded w-full p-2 mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="w-full">
              <p>Password</p>
              <input
                type="password"
                required
                className="border border-[#DADADA] rounded w-full p-2 mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="w-full text-right">
              <span
                onClick={() => navigate("/doctor/verify-email")}
                className="text-primary underline cursor-pointer text-sm"
              >
                Forgot Password?
              </span>
            </div>

            <button className="bg-primary text-white w-full py-2 rounded-md text-base">
              Login
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DoctorLogin;
