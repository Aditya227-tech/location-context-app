import React, { createContext, useState, useContext } from 'react';
import AuthService from '../services/api';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());

  const login = async (email, password) => {
    await AuthService.login(email, password);
    setIsAuthenticated(true);
  };

  const register = async (email, password) => {
    await AuthService.register(email, password);
    setIsAuthenticated(true);
  };

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentLocation(null);
    setSelectedAddress(null);
  };

  const saveAddress = (address) => {
    setSavedAddresses(prev => [...prev, address]);
  };

  return (
    <AppContext.Provider value={{
      currentLocation,
      setCurrentLocation,
      selectedAddress,
      setSelectedAddress,
      savedAddresses,
      saveAddress,
      isAuthenticated,
      login,
      register,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};