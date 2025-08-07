import React, { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const context = useContext(AdminContext);
  const [isLoading, setIsLoading] = useState(true);

  if (!context) {
    throw new Error("AdminContext must be used within AdminContextProvider");
  }

  const { aToken, loading } = context;

  useEffect(() => {
    // Wait for the admin context to finish loading
    if (!loading) {
      setIsLoading(false);
    }
  }, [loading]);

  // Show loading while checking authentication
  if (isLoading || loading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to admin login if no admin token
  if (!aToken) {
    return <Navigate to="/admin/login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default AdminProtectedRoute;