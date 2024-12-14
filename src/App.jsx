import './App.css'

import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import AuthModal from './components/AuthModal';
import LocationPicker from './components/LocationPicker';
import { useAppContext } from './contexts/AppContext';

const AppContent = () => {
  const { isAuthenticated, logout } = useAppContext();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(!isAuthenticated);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-500 p-4 flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">Location Saver</h1>
        {isAuthenticated && (
          <button 
            onClick={logout}
            className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50"
          >
            Logout
          </button>
        )}
      </nav>

      {!isAuthenticated ? (
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      ) : (
        <LocationPicker />
      )}
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;