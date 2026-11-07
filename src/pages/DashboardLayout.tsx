import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '../components/ui';
import { useAuth } from '../features/auth/AuthProvider';
import { useRestaurant } from '../features/restaurant/useRestaurant';

export default function DashboardLayout() {
  const { restaurant, canManage } = useRestaurant();
  const { signOut } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Overview', end: true, show: true },
    { to: '/dashboard/menu', label: 'Menu', end: false, show: canManage },
    { to: '/dashboard/tables', label: 'Tables', end: false, show: canManage },
    { to: '/dashboard/branding', label: 'Branding', end: false, show: canManage },
    { to: '/dashboard/team', label: 'Team', end: false, show: canManage },
    { to: '/dashboard/settings', label: 'Settings', end: false, show: canManage },
  ].filter((l) => l.show);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-100'}`;

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-stone-200 bg-white p-4 md:flex">
        <div className="mb-6 px-2">
          <p className="truncate font-bold">{restaurant.name}</p>
          <p className="truncate text-xs text-stone-500">/r/{restaurant.slug}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
          ))}
        </nav>
        <Button variant="ghost" className="mt-auto" onClick={() => void signOut()}>Sign out</Button>
      </aside>

      <div className="flex-1 pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:hidden">
          <p className="truncate font-bold">{restaurant.name}</p>
          <button onClick={() => void signOut()} className="text-sm font-medium text-stone-600">Sign out</button>
        </header>
        <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 md:py-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex gap-1 border-t border-stone-200 bg-white p-2 md:hidden">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={(s) => `flex-1 text-center ${linkClass(s)}`}>{l.label}</NavLink>
        ))}
      </nav>
    </div>
  );
}
