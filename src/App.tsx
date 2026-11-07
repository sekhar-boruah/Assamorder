import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireManager, RequireRestaurant } from './features/auth/guards';
import Branding from './pages/Branding';
import DashboardLayout from './pages/DashboardLayout';
import CategoryEdit from './pages/CategoryEdit';
import ItemEdit from './pages/ItemEdit';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Onboarding from './pages/Onboarding';
import Overview from './pages/Overview';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Team from './pages/Team';

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
              <Route path="/dashboard/menu" element={<Menu />} />
              <Route path="/dashboard/menu/category/:id" element={<CategoryEdit />} />
              <Route path="/dashboard/menu/item/:id" element={<ItemEdit />} />
              <Route path="/dashboard/branding" element={<Branding />} />
              <Route path="/dashboard/team" element={<Team />} />
              <Route path="/dashboard/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
