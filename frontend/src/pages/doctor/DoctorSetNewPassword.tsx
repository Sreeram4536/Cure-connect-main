import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DoctorContext } from "../../context/DoctorContext";
import { resetDoctorPasswordAPI } from "../../services/doctorServices";
import axios from "axios";

const DoctorNewPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const context = useContext(DoctorContext);

  if (!context) {
    throw new Error("DoctorNewPasswordPage must be used within a DoctorContextProvider");
  }

  const { dToken } = context;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const tempDoctor = JSON.parse(localStorage.getItem("tempDoctorData") || "{}");
      const { data } = await resetDoctorPasswordAPI(tempDoctor.email, password);

      if (data.success) {
        toast.success("Password reset successful");
        localStorage.removeItem("tempDoctorData");
        navigate("/doctor/login");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg =
          error.response?.data?.message || "Something went wrong";
        toast.error(errorMsg);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  useEffect(() => {
    if (dToken) {
      navigate("/doctor/dashboard");
    }
  });

  return (
    <form className="min-h-[80vh] flex items-center">
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
        <p className="text-2xl font-semibold">Set New Password</p>
        <p>Create a strong password for your account</p>
        <div className="w-full">
          <p>New Password</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            type="password"
            required
          />
        </div>
        <div className="w-full">
          <p>Confirm Password</p>
          <input
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            type="password"
            required
          />
        </div>

        <button
          onClick={handleSubmit}
          type="submit"
          className="bg-primary text-white w-full py-2 rounded-md text-base"
        >
          Set New Password
        </button>
      </div>
    </form>
  );
};

export default DoctorNewPasswordPage;

