import { createContext, useContext } from 'react';

export const AuthContext = createContext(); //global authentification container

//custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider component');
  }
  return context;
};
