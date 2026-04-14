import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthHome } from './pages/AuthHome.jsx';
import { Landing } from './pages/Landing.jsx';
import { PatientDashboard } from './pages/PatientDashboard.jsx';
import { PatientReports } from './pages/PatientReports.jsx';
import { PatientTrack } from './pages/PatientTrack.jsx';
import { ReportDetail } from './pages/ReportDetail.jsx';
import { PatientInsights } from './pages/PatientInsights.jsx';
import { PatientAwareness } from './pages/PatientAwareness.jsx';
import { PatientChatbot } from './pages/PatientChatbot.jsx';
import { LabDashboard } from './pages/LabDashboard.jsx';
import { LabSamples } from './pages/LabSamples.jsx';
import { LabReports } from './pages/LabReports.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthHome />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Landing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient"
        element={
          <ProtectedRoute role="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/reports"
        element={
          <ProtectedRoute role="patient">
            <PatientReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/reports/:id"
        element={
          <ProtectedRoute role="patient">
            <ReportDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/track/:code"
        element={
          <ProtectedRoute role="patient">
            <PatientTrack />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/insights"
        element={
          <ProtectedRoute role="patient">
            <PatientInsights />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/awareness"
        element={
          <ProtectedRoute role="patient">
            <PatientAwareness />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/chatbot"
        element={
          <ProtectedRoute role="patient">
            <PatientChatbot />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lab"
        element={
          <ProtectedRoute role="lab">
            <LabDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab/samples"
        element={
          <ProtectedRoute role="lab">
            <LabSamples />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab/reports"
        element={
          <ProtectedRoute role="lab">
            <LabReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab/reports/:id"
        element={
          <ProtectedRoute role="lab">
            <ReportDetail />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
