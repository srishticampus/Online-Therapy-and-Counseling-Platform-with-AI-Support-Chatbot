// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/admin/LandingPage';
import Footer from './components/common/Footer';
import Navbar from './components/common/Nav';
import AboutUs from './pages/admin/AboutUs';
import ContactUs from './pages/admin/ContactUs';
import AdminLogin from './pages/admin/AdminLogin';
import UserLogin from './pages/user/UserLogin';
import ForgotPassword from './pages/admin/ForgotPassword';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './layouts/AdminLayout';
import CounselorApproval from './pages/admin/CounselorApproval';
import UserList from './pages/admin/UserList';
import Register from './pages/user/Register';
import UserLayout from './layouts/UserLayout';
import Profile from './pages/user/Profile';
import Aichat from './pages/user/Aichat';
import BookAppoinment from './pages/user/BookAppoinment';
import ViewAppoinment from './pages/user/ViewAppoinment';
import MoodTracker from './pages/user/MoodTracker';
import CounselorPendingReq from './pages/user/CounselorPendingReq';
import MySchedule from './pages/user/MyShedule';
import AvailabilitySettings from './pages/user/AvailabilitySettings';
import MyClient from './pages/user/MyClient';
import CounselorDashboard from './pages/user/CounselorDashboard';
import UserDashboard from './pages/user/UserDashboard';
import RobotAi from './pages/user/RobotAi';
import ViewAllAppoinment from './pages/admin/ViewAllAppoinment';
import Resources from './pages/admin/Resources';
import AdminReport from './pages/admin/AdminReport';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageResource from './pages/admin/ManageResource';
import AdminContacts from './pages/admin/AdminContacts';

// Placeholder Pages for testing

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#0f172a', // Navy theme
            color: '#fff',
          },
        }}
      />
      {/* Navbar sits outside Routes so it appears on all pages */}


      <Routes>
        <Route path="/" element={<><Navbar /><LandingPage /><Footer /></>} />
        <Route path="/about" element={<><Navbar /><AboutUs /><Footer /></>} />
        <Route path="/contactus" element={<><Navbar /><ContactUs /><Footer /></>} />

        <Route path="/admin/login" element={<><Navbar /><AdminLogin /><Footer /></>} />
        <Route path="/login" element={<><Navbar /><UserLogin /><Footer /></>} />
        <Route path="/forgot-password" element={<><Navbar /><ForgotPassword /><Footer /></>} />
        <Route path="/register" element={<><Navbar /><Register /><Footer /></>} />

        <Route element={<AdminLayout />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/verify-counselors" element={<CounselorApproval />} />
          <Route path="/admin/users" element={<UserList />} />
          <Route path="/admin/appointments" element={<ViewAllAppoinment />} />
          <Route path="/admin/resources" element={<Resources />} />
          <Route path="/admin/reports" element={<AdminReport />} />
          <Route path="/admin/resources/add" element={<ManageResource />} />
          <Route path="/admin/resources/edit/:id" element={<ManageResource />} />
          <Route path="/admin/contact" element={<AdminContacts />} />



        </Route>

        <Route element={<UserLayout />}>
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/ai-chat" element={<Aichat />} />
          <Route path="/user/robot-ai" element={<RobotAi />} />
          <Route path="/user/book" element={<BookAppoinment />} />
          <Route path="/user/appointments" element={<ViewAppoinment />} />
          <Route path="/user/mood" element={<MoodTracker />} />
          <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
          <Route path="/counselor/requests" element={<CounselorPendingReq />} />
          <Route path="/counselor/schedule" element={<MySchedule />} />
          <Route path="/counselor/availability" element={<AvailabilitySettings />} />
          <Route path="/counselor/clients" element={<MyClient />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;