import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { Register } from './Authentication/Register';
import { OtpVerification } from './Authentication/OtpVerification';
import { Login } from './Authentication/Login';

import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Agents } from './pages/Agents';
import { AgentBuilder } from './pages/AgentBuilder';
import { Campaign } from './pages/Campaign';
import { Contacts } from './pages/Contacts';
import { ContactDetail } from './pages/ContactDetail';
import { CampaignDetail } from './pages/CampaignDetail';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Analytics } from './pages/Analytics';
import { UserManagement } from './pages/UserManagement';
import { AssignAgent } from './pages/AssignAgent';
import { AssignCampaign } from './pages/AssignCampaign';
import { AssignPhone } from './pages/AssignPhone';
import { OrganizationSettings } from './pages/OrganizationSettings';
import { PhoneNumbers } from './pages/PhoneNumbers';
import { Calls } from './pages/Calls';
import { GlobalChatBot } from './components/GlobalChatBot';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              padding: '12px 24px',
              border: '1px solid #1e293b'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentBuilder />} />
          <Route path="/campaigns/outbound" element={<Campaign />} />
          <Route path="/campaigns/outbound/:id" element={<CampaignDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/assign-agent" element={<AssignAgent />} />
          <Route path="/assign-campaign" element={<AssignCampaign />} />
          <Route path="/assign-phone" element={<AssignPhone />} />
          <Route path="/organization" element={<OrganizationSettings />} />
          <Route path="/phone-numbers" element={<PhoneNumbers />} />
          <Route path="/calls" element={<Calls />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* Globally Available AI Chatbot */}
        <GlobalChatBot />

      </div>
    </BrowserRouter>
  );
}

export default App;
