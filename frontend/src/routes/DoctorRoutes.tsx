import { Route } from "react-router-dom";

// Layout
import DoctorLayout from "../layouts/DoctorLayout";

// Doctor Pages
import DoctorLogin from "../pages/doctor/DoctorLogin";
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import DoctorConsultation from "../pages/doctor/DoctorConsultation";
import DocChatPage from "../pages/doctor/DocChatPage";
import DoctorRegister from "../pages/doctor/DoctorRegister";
import DoctorSlotManager from "../pages/doctor/DoctorSlotManagement";
import DoctorInbox from "../pages/doctor/DoctorInbox";
import DoctorWallet from "../pages/doctor/DoctorWallet";

const DoctorRoutes = () => {
  return (
    <>
      <Route path="/doctor/register" element={<DoctorRegister />} />
      <Route path="/doctor/login" element={<DoctorLogin />} />
      <Route
        path="/doctor/dashboard"
        element={
          <DoctorLayout>
            <DoctorDashboard />
          </DoctorLayout>
        }
      />
      <Route
        path="/doctor/appointments"
        element={
          <DoctorLayout>
            <DoctorAppointments />
          </DoctorLayout>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <DoctorLayout>
            <DoctorProfile />
          </DoctorLayout>
        }
      />
      <Route
        path="/doctor/slot-management"
        element={
          <DoctorLayout>
            <DoctorSlotManager />
          </DoctorLayout>
        }
      />
      <Route
        path="/doctor/consultation"
        element={
          <DoctorLayout>
            <DoctorConsultation />
          </DoctorLayout>
        }
      />
      <Route
        path="/doctor/inbox"
        element={
          <DoctorLayout>
            <DoctorInbox />
          </DoctorLayout>
        }
      />
      <Route
        path="/doctor/chat/:conversationId"
        element={
          <DoctorLayout>
            <DocChatPage />
          </DoctorLayout>
        }
      />
      <Route
        path="/doctor/wallet"
        element={
          <DoctorLayout>
            <DoctorWallet />
          </DoctorLayout>
        }
      />
    </>
  );
};

export default DoctorRoutes;
