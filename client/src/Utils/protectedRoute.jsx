//Who is allowed to see which pages
import React from 'react';
import {Navigate} from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LoadingScreen = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
);

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  //if logged in allow access to the page
  return children;
};
//Role protected Routes
export const RoleProtectedRoute=({children,allowedRoles=[],redirectTo="/listings"})=>{
  const {user,loading,isAuthenticated}=useAuth();
  if(loading){
    return(
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
          <p className='mt-4 text-gray-600'>Checking permissions...</p>
        </div>
      </div>
    )
  }
  //if not logged in redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
//if logged in but not allowed role redirect to login page
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  //if logged in and allowed role allow access to the page
  return children;
};

export const AdminRoute = ({ children }) => {
  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      {children}
    </RoleProtectedRoute>
  );
};

export const LandlordRoute = ({ children }) => {
  return (
    <RoleProtectedRoute allowedRoles={["landlord"]}>
      {children}
    </RoleProtectedRoute>
  );
};

export const TenantRoute = ({ children }) => {
  return (
    <RoleProtectedRoute allowedRoles={["tenant"]}>
      {children}
    </RoleProtectedRoute>
  );
};


