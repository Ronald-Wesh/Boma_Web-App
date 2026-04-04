import React, { useEffect, useState } from "react";
import {
  authAPI,
  registerUnauthorizedHandler,
  setAuthToken,
} from "../Utils/api";
import { toast } from "sonner";
import { AuthContext } from "../hooks/useAuth";

//Component wraps the entire app
export const AuthProvider = ({ children }) => {
    //children=components that will be wrapped
  const [token, setToken] = useState(null);//stores jwt token
  const [user, setUser] = useState(null);//stores loggedin-user info
  const [loading, setLoading] = useState(true);//loading state

  const persistAuth = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    setAuthToken(nextToken);

    if (nextToken) {
      localStorage.setItem("token", nextToken);
    } else {
      localStorage.removeItem("token");
    }

    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  const clearAuthState = () => {
    persistAuth(null, null);
  };
  //check if user is logged in when app starts
  useEffect(() => {
    //runs once when app starts
    const unregister = registerUnauthorizedHandler(() => {
      clearAuthState();
    });

    return unregister;
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setAuthToken(storedToken);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse stored user", error);
        }
      }

      try {
        const response = await authAPI.getMe();
        persistAuth(storedToken, response.data.user);
      } catch (error) {
        console.error("Error verifying token", error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      const { token: nextToken, user: nextUser } = response.data;

      persistAuth(nextToken, nextUser);
      toast.success(
        `Welcome to Boma ${nextUser.name || nextUser.email.split("@")[0]}!`,
      );
      return { success: true, token: nextToken, user: nextUser };
    } catch (error) {
      console.error("Login failed", error);
      toast.error(error.response?.data?.message || "Login failed");
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      const { token: nextToken, user: nextUser } = response.data;

      persistAuth(nextToken, nextUser);
      toast.success(
        `Welcome to Boma ${nextUser.name || nextUser.email.split("@")[0]}!`,
      );
      return { success: true, token: nextToken, user: nextUser };
    } catch (error) {
      console.error("Registration failed", error);
      toast.error(error.response?.data?.message || "Registration failed");
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    clearAuthState();
    toast.success("Logged out Successfully");
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      const updatedUser = response.data.user;
      persistAuth(token, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Failed to refresh user", error);
      toast.error("Failed to refresh user");
      return null;
    }
  };

  const updateUser = (updatedUserData) => {
    //no backend call,just updates local state
    const newUserData = { ...user, ...updatedUserData };
    persistAuth(token, newUserData);
  };
  //helper functions for rolechecking
  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === "admin";
  const isLandlord = user?.role === "landlord";
  const isTenant = user?.role === "tenant";

  //defines what context will share with entire application
  const value = {
    //state
    user,
    loading,
    isAuthenticated,

    //actions
    login,
    register,
    logout,
    refreshUser,
    updateUser,

    //role helpers
    isAdmin,
    isLandlord,
    isTenant,
  };

  //everything in authprovider can acces value object
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



  // useEffect(() => {
  //   const initializeAuth = async () => {
  //     const token = localStorage.getItem("token"); //check if login data exists
  //     const userData = localStorage.getItem("user");
  //     if (token && userData) {
  //       //if yes-user is logged in
  //       try {
  //         const parsedUser = JSON.parse(userData); //convert string into json object
  //         setUser(parsedUser); //update react state=hence UI knows user is logged in

  //         //verify token is still valid by calling backend
  //         const response = await authAPI.getme(); //call backend to verify token
  //         const currentUser = response.data; //get current user from backend
  //         //if backend returns different user data=update it
  //         if (JSON.stringify(currentUser) !== JSON.stringify(parsedUser)) {
  //           localStorage.setItem("user", JSON.stringify(currentUser));
  //           setUser(currentUser); //matches backend data to frontend
  //         }
  //       } catch (error) {
  //         console.error("Error verifying token", error);
  //         //if token is invalid clear it
  //         localStorage.removeItem("token");
  //         localStorage.removeItem("user");
  //         setUser(null);
  //       }
  //     }
  //     setLoading(false); //done checking auth, stop loading
  //   };
  //   initializeAuth(); //actually call the function
  // }, []); //empty dependency array=run once on mount

  // const login = async (email, password) => {
  //   try {
  //     setLoading(true); //tells UI login/loading process started
  //     const response = await authAPI.login({ email, password }); //sends post request
  //     const { token, user: newUserData, ...otherData } = response.data; //extracts data from backend response

  //     const finalUserData = newUserData || { ...otherData, email, password };

  //     //save to local storage
  //     localStorage.setItem("token", token);
  //     localStorage.setItem("user", JSON.stringify(finalUserData));

  //     //update state
  //     setUser(finalUserData);
  //     toast.success(
  //       `Welcome to Boma ${finalUserData.name || finalUserData.email.split("@")[0]}!`,
  //     );
  //     return { succes: true, user: finalUserData };
  //   } catch (error) {
  //     console.error("Login failed", error);
  //     toast.error("Login failed. Please try again.");
  //     return {
  //       success: false,
  //       error: error.response?.data?.message || "Login failed",
  //     };
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const register = async (userData) => {
  //   try {
  //     setLoading(true);
  //     const response = await authAPI.register(userData);

  //     const { token, user: newUserData, ...otherData } = response.data;
  //     const finalUserData = newUserData || { ...otherData };

  //     //save to local storage
  //     localStorage.setItem("token", token);
  //     localStorage.setItem("user", JSON.stringify(finalUserData));
  //     setUser(finalUserData);
  //     toast.success(
  //       `Welcome to Boma ${finalUserData.name || finalUserData.email.split("@")[0]}!`,
  //     );
  //     return { success: true, user: finalUserData };
  //   } catch (error) {
  //     console.error("Registration failed", error);
  //     toast.error("Registration failed. Please try again.");
  //     return {
  //       success: false,
  //       error: error.response?.data?.message || "Registration failed",
  //     };
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // const logout = () => {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("user");
  //   setUser(null);
  //   toast.success("Logged out Successfully");
  // };

  // //refreshes user data from backend=fetches latest user data from backend
  // const refreshUser = async () => {
  //   try {
  //     const response = await authAPI.getme();
  //     const updatedUser = response.data;
  //     setUser(updatedUser); //updates react state with latest data
  //     localStorage.setItem("user", JSON.stringify(updatedUser)); //updates local storage with latest data
  //     toast.success("Profile updated successfully");
  //   } catch (error) {
  //     console.error("Failed to refresh user", error);
  //     toast.error("Failed to refresh user");
  //     return null;
  //   }
  };
