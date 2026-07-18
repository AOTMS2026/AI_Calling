import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { Register } from './pages/Register';
import { OtpVerification } from './pages/OtpVerification';
import { Login } from './pages/Login';

import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Contacts } from './pages/Contacts';
import { Campaign } from './pages/Campaign';
import { Calls } from './pages/Calls';
import { Profile } from './pages/Profile';
import { Analytics } from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/campaigns" element={<Campaign />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/analytics" element={<Analytics />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
