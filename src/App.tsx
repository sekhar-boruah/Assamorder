import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireManager, RequireRestaurant } from './features/auth/guards';
import Branding from './pages/Branding';
import DashboardLayout from './pages/DashboardLayout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Overview from './pages/Overview';
import Register from './pages/Register';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<RequireRestaurant />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Overview />} />
            <Route element={<RequireManager />}>
              <Route path="/dashboard/branding" element={<Branding />} />
              <Route path="/dashboard/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
