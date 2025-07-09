import { useState } from 'react'
import './App.css'
import Login from './components/Login'
import CartonScanner from './components/CartonScanner'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="App">
      {/* Header with Login/Logout in upper right */}
      <div className="bg-gray-100 border-b p-4 flex-shrink-0">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xs font-bold">Acumatica Carton Scanner</h1>
          {isLoggedIn ? (
            <button 
              onClick={handleLogout} 
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            >
              Logout
            </button>
          ) : (
            <div className="text-gray-600 text-sm">Please login to continue</div>
          )}
        </div>
      </div>

      <div className="flex-1">
        {isLoggedIn ? (
          <CartonScanner />
        ) : (
          <div className="container mx-auto p-4">
            <Login onLoginSuccess={handleLoginSuccess} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App
