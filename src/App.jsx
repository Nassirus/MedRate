import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// Auth
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

// Patient
import Home from './pages/Patient/Home'
import SearchPage from './pages/Patient/Search'
import DoctorDetail from './pages/Patient/DoctorDetail'
import LeaveReview from './pages/Patient/LeaveReview'
import ScanPage from './pages/Patient/Scan'
import Schedule from './pages/Patient/Schedule'
import Profile from './pages/Patient/Profile'
import BookAppointment from './pages/Patient/BookAppointment'

// Clinic
import ClinicDashboard from './pages/Clinic/Dashboard'
import ClinicDoctors from './pages/Clinic/Doctors'
import ClinicQR from './pages/Clinic/QRGenerator'
import ClinicReviews from './pages/Clinic/Reviews'
import ClinicSetup from './pages/Clinic/Setup'

// Moderation
import ModerationPanel from './pages/Moderation/ModerationPanel'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0F1419] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#1A2B4A] dark:border-[#4A7FCC] border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-[#9CA3AF]">Загрузка MedRate...</p>
      </div>
    </div>
  )

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Patient routes */}
      <Route path="/home" element={<Home />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/doctor/:id" element={<DoctorDetail />} />
      <Route path="/review/:doctorId" element={<LeaveReview />} />
      <Route path="/scan" element={<ScanPage />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/book/:doctorId" element={<BookAppointment />} />

      {/* Clinic routes */}
      <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
      <Route path="/clinic/doctors" element={<ClinicDoctors />} />
      <Route path="/clinic/qr" element={<ClinicQR />} />
      <Route path="/clinic/reviews" element={<ClinicReviews />} />
      <Route path="/clinic/setup" element={<ClinicSetup />} />

      {/* Moderation */}
      <Route path="/moderation" element={<ModerationPanel />} />

      {/* Default redirect */}
      <Route path="/" element={
        !user ? <Navigate to="/login" replace />
        : profile?.role === 'clinic_admin' ? <Navigate to="/clinic/dashboard" replace />
        : profile?.role === 'moderator' ? <Navigate to="/moderation" replace />
        : <Navigate to="/home" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
