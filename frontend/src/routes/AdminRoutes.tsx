import { Route } from "react-router-dom";

// Layout
import AdminLayout from "../layouts/AdminLayout";
import AdminProtectedRoute from "../components/admin/AdminProtectedRoute";

// Admin Pages
import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsersList from "../pages/admin/AdminUsersList";
import AdminAppointments from "../pages/admin/AdminAppointments";
import AdminAddDoctor from "../pages/admin/AdminAddDoctor";
import AdminUpdateDoctor from "../pages/admin/AdminUpdateDoctor";
import AdminDoctorList from "../pages/admin/AdminDoctorList";
import AdminInbox from "../pages/admin/AdminInbox";
import AdminDoctorRequests from "../pages/admin/AdminDoctorRequests";

const AdminRoutes = () => {
  return (
    <>
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/user-management"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminUsersList />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminAppointments />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/doctor-requests"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminDoctorRequests />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/update-doctor"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminUpdateDoctor />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/all-doctors"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminDoctorList />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/inbox"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminInbox />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
    </>
  );
};

export default AdminRoutes;
