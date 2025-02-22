import { NavLink } from 'react-router-dom';
import { Package, Truck, Building2, MapPin, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Orders', to: '/orders', icon: Package },
  { name: 'Suppliers', to: '/suppliers', icon: Building2 },
  { name: 'Carriers', to: '/carriers', icon: Truck },
  { name: 'Destinations', to: '/destinations', icon: MapPin },
];

export default function Sidebar() {
  return (
    <div className="flex w-64 flex-col bg-gray-800">
      <div className="flex h-16 items-center justify-center">
        <h1 className="text-xl font-bold text-white">Order Management</h1>
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
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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