import { NavLink } from 'react-router-dom';
import { Package, Truck, Building2, MapPin, LayoutDashboard, Users, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { signOut } from '../lib/supabase';

export default function Sidebar() {
  const { t } = useTranslation();

  const navigation = [
    { name: t('dashboard'), to: '/', icon: LayoutDashboard },
    { name: t('orders'), to: '/orders', icon: Package },
    { name: t('suppliers'), to: '/suppliers', icon: Building2 },
    { name: t('carriers'), to: '/carriers', icon: Truck },
    { name: t('destinations'), to: '/destinations', icon: MapPin },
    { name: t('users'), to: '/users', icon: Users },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex w-64 flex-col bg-[#0284c7]">
      <div className="flex h-16 items-center px-4 bg-white">
        <img 
          src="https://www.nhclima.com/images/logo_black.svg" 
          alt="NH Clima" 
          className="h-8"
        />
      </div>
      <nav className="mt-5 flex-1 space-y-1 px-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <item.icon
              className="mr-3 h-6 w-6 flex-shrink-0"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
        
        <button
          onClick={handleLogout}
          className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white/80 hover:bg-white/5 hover:text-white"
        >
          <LogOut
            className="mr-3 h-6 w-6 flex-shrink-0"
            aria-hidden="true"
          />
          {t('logout')}
        </button>
      </nav>
      <div className="p-4 text-[8px] text-white/60 text-center border-t border-white/10">
        criado por: Pedro Almeida & meGa
      </div>
    </div>
  );
}