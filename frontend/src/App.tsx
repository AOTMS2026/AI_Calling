import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import { Toaster } from 'react-hot-toast';
import { GlobalChatBot } from './components/GlobalChatBot';

// Lazy load route pages to segment bundling chunks cleanly
const Register = lazy(() => import('./Authentication/Register').then(m => ({ default: m.Register })));
const OtpVerification = lazy(() => import('./Authentication/OtpVerification').then(m => ({ default: m.OtpVerification })));
const Login = lazy(() => import('./Authentication/Login').then(m => ({ default: m.Login })));

const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Agents = lazy(() => import('./pages/Agents').then(m => ({ default: m.Agents })));
const AgentBuilder = lazy(() => import('./pages/AgentBuilder').then(m => ({ default: m.AgentBuilder })));
const Campaign = lazy(() => import('./pages/Campaign').then(m => ({ default: m.Campaign })));
const Contacts = lazy(() => import('./pages/Contacts').then(m => ({ default: m.Contacts })));
const ContactDetail = lazy(() => import('./pages/ContactDetail').then(m => ({ default: m.ContactDetail })));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail').then(m => ({ default: m.CampaignDetail })));
const InboundCampaign = lazy(() => import('./pages/InboundCampaign').then(m => ({ default: m.InboundCampaign })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const UserManagement = lazy(() => import('./pages/UserManagement').then(m => ({ default: m.UserManagement })));
const AssignAgent = lazy(() => import('./pages/AssignAgent').then(m => ({ default: m.AssignAgent })));
const AssignCredits = lazy(() => import('./pages/AssignCredits').then(m => ({ default: m.AssignCredits })));
const AssignCampaign = lazy(() => import('./pages/AssignCampaign').then(m => ({ default: m.AssignCampaign })));
const Appointments = lazy(() => import('./pages/Appointments').then(m => ({ default: m.Appointments })));
const AdminAppointments = lazy(() => import('./pages/AdminAppointments').then(m => ({ default: m.AdminAppointments })));
const AdminCalcom = lazy(() => import('./pages/AdminCalcom'));
const AdminAgentsAssigningList = lazy(() => import('./pages/AdminAgentsAssigningList').then(m => ({ default: m.AdminAgentsAssigningList })));

const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings').then(m => ({ default: m.OrganizationSettings })));
const PhoneNumbers = lazy(() => import('./pages/PhoneNumbers').then(m => ({ default: m.PhoneNumbers })));
const AdminPhoneNumbers = lazy(() => import('./pages/AdminPhoneNumbers').then(m => ({ default: m.AdminPhoneNumbers })));
const Calls = lazy(() => import('./pages/Calls').then(m => ({ default: m.Calls })));
const TodoList = lazy(() => import('./pages/TodoList').then(m => ({ default: m.TodoList })));
const WhatsAppAutomation = lazy(() => import('./pages/WhatsAppAutomation'));

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
        <Suspense fallback={
          <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center flex-col space-y-4 z-50">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
            <span className="text-[10px] text-emerald-500 font-black tracking-widest uppercase animate-pulse mt-3">LOADING PLATFORM CORE...</span>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OtpVerification />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:id" element={<AgentBuilder />} />
            <Route path="/campaigns/outbound" element={<Campaign />} />
            <Route path="/campaigns/inbound" element={<InboundCampaign />} />
            <Route path="/campaigns/outbound/:id" element={<CampaignDetail />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/assign-agent" element={<AssignAgent />} />
            <Route path="/assign-credits" element={<AssignCredits />} />
            <Route path="/assign-campaign" element={<AssignCampaign />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
            <Route path="/admin/calcom" element={<AdminCalcom />} />
            <Route path="/admin/assigned-agents" element={<AdminAgentsAssigningList />} />

            <Route path="/organization" element={<OrganizationSettings />} />
            <Route path="/phone-numbers" element={<PhoneNumbers />} />
            <Route path="/admin/phone-numbers" element={<AdminPhoneNumbers />} />
            <Route path="/calls" element={<Calls />} />
            <Route path="/todos" element={<TodoList />} />
            <Route path="/whatsapp" element={<WhatsAppAutomation />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>

        {/* Globally Available AI Chatbot */}
        <GlobalChatBot />

      </div>
    </BrowserRouter>
  );
}

export default App;
