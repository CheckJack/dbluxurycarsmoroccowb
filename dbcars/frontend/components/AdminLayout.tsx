'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAdminBookings } from '@/lib/api';
import { Toaster } from 'react-hot-toast';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import { 
  LayoutDashboard, 
  Calendar, 
  Car, 
  Gift, 
  Ticket, 
  MapPin, 
  Users, 
  UserCog, 
  CalendarCheck,
  FileText,
  Home,
  LogOut,
  ChevronRight,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';
import HelpCenter from '@/components/admin/HelpCenter';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [pendingBookingsCount, setPendingBookingsCount] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('auth_token');
      
      if (!token || !userStr) {
        router.push('/admin/login');
        setIsCheckingAuth(false);
        return;
      }

      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/admin/login');
      } finally {
        setIsCheckingAuth(false);
      }
    }
  }, [router]);

  useEffect(() => {
    const loadPendingBookings = async () => {
      try {
        const data = await getAdminBookings({ status: 'pending' });
        const bookings = data.bookings || data;
        setPendingBookingsCount(Array.isArray(bookings) ? bookings.length : 0);
      } catch (error) {
        console.error('Error loading pending bookings:', error);
      }
    };

    if (user) {
      loadPendingBookings();
      // Refresh every 30 seconds
      const interval = setInterval(loadPendingBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // If no user after checking, don't render (will redirect)
  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/bookings', label: 'Bookings', icon: Calendar, badge: pendingBookingsCount },
    { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
    { href: '/admin/extras', label: 'Extras', icon: Gift },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/locations', label: 'Locations', icon: MapPin },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/users', label: 'Users', icon: UserCog },
    { href: '/admin/availability', label: 'Availability', icon: CalendarCheck },
    { href: '/admin/blog', label: 'Blog Posts', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-black flex h-screen overflow-hidden">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Left Sidebar - Mobile: Drawer, Tablet/Desktop: Fixed */}
      <aside className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'w-64' : 'w-20'}
        bg-gradient-to-b from-gray-900 via-gray-900 to-black 
        shadow-2xl fixed top-0 left-0 h-full z-40 
        flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
        border-r border-gray-800
      `}>
        {/* Logo/Header */}
        <div className="p-5 border-b border-gray-800 flex-shrink-0 bg-gradient-to-r from-gray-900 to-black">
          <div className="flex items-center justify-between mb-4">
            {sidebarOpen && (
              <Link href="/admin/dashboard" className="text-xl font-bold text-white tracking-tight">
              Admin Panel
            </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <Link
            href="/"
            className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] group"
          >
            <Home className="w-5 h-5 flex-shrink-0 transition-transform" />
            {sidebarOpen && <span>Go to Homepage</span>}
          </Link>
        </div>

        {/* Navigation - Scrollable area */}
        <nav className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="p-3">
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const showBadge = item.badge && item.badge > 0;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        group relative flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`} />
                      {sidebarOpen && (
                        <>
                          <span className="font-medium flex-1">{item.label}</span>
                          {showBadge && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 px-2 flex items-center justify-center min-w-[24px] shadow-md animate-pulse">
                              {item.badge! > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* User Info & Actions - Fixed at bottom */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0 bg-gradient-to-t from-black to-gray-900">
          <div className={`mb-3 ${!sidebarOpen && 'flex justify-center'}`}>
            {sidebarOpen ? (
              <>
                <p className="text-xs text-gray-400 mb-1 font-medium">Logged in as</p>
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
              </>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
          </div>
          
          {/* Help Button */}
          <button
            onClick={() => {
              setHelpCenterOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] group mb-2"
            title="Help"
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0 transition-transform" />
            {sidebarOpen && <span>Help Center</span>}
          </button>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`
        flex-1 transition-all duration-300 
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        pt-16 lg:pt-0
        overflow-y-auto
        bg-black
      `}>
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl min-h-full">{children}</div>
      </div>

      {/* Help Center Modal */}
      <HelpCenter
        isOpen={helpCenterOpen}
        onClose={() => setHelpCenterOpen(false)}
        pathname={pathname}
      />
    </div>
  );
}
