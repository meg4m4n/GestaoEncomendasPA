import { NavLink } from 'react-router-dom';
import { Package, Truck, Building2, MapPin, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { t } = useTranslation();

  const navigation = [
    { name: t('dashboard'), to: '/', icon: LayoutDashboard },
    { name: t('orders'), to: '/orders', icon: Package },
    { name: t('suppliers'), to: '/suppliers', icon: Building2 },
    { name: t('carriers'), to: '/carriers', icon: Truck },
    { name: t('destinations'), to: '/destinations', icon: MapPin },
  ];

  return (
    <div className="flex w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-4 border-b border-gray-200">
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
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
      </nav>
    </div>
  );
}