import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Home from './pages/customer/Home';
import Booking from './pages/customer/Booking';
import MyBookings from './pages/customer/MyBookings';

// Pages
import Login from './pages/shared/Login';
import Register from './pages/shared/Register';

// Placeholders for future pages
const HomePlaceholder = () => <div className="p-8 text-center text-xl font-medium">Customer Home / Search Services (Coming Soon)</div>;
const ProviderPlaceholder = () => <div className="p-8 text-center text-xl font-medium">Provider Dashboard (Coming Soon)</div>;
const AdminPlaceholder = () => <div className="p-8 text-center text-xl font-medium">Admin Panel (Coming Soon)</div>;

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-page">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Customer Routes */}
<Route element={<ProtectedRoute allowedRoles={['customer']} />}>
  <Route path="/" element={<Home />} />
  <Route path="/book/:providerId" element={<Booking />} />
  <Route path="/customer/bookings" element={<MyBookings />} />
</Route>

                {/* Protected Provider Routes */}
                <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
                  <Route path="/provider" element={<ProviderPlaceholder />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminPlaceholder />} />
                </Route>
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;