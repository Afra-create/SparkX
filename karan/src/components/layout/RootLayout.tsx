import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import AuthModal from '../auth/AuthModal';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState } from 'react';
import Preloader from '../common/Preloader';


export default function RootLayout() {
  const { isAuthModalOpen, setUser, setLoading } = useAuthStore();
  const [showPreloader, setShowPreloader] = useState(true);
  const location = useLocation();
  
  // Set up auth session listener
  useEffect(() => {
    // Restore session from localStorage on page load
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch { /* ignore */ }
    }
    setLoading(false);

    // Initial app branding delay
    const timer = setTimeout(() => {
      setShowPreloader(false);
    }, 3200); // Slightly longer than preloader exit to ensure smooth overlay transition

    return () => clearTimeout(timer);
  }, [setUser, setLoading]);


  const isHome = location.pathname === '/';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[hsl(var(--background))] text-foreground flex flex-col">
      {/* Persisting Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 z-0 h-full w-full object-cover"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlay for inner pages to increase readability */}
      {!isHome && (
        <div className="fixed inset-0 z-0 bg-background/80 backdrop-blur-[8px] transition-all duration-700 pointer-events-none" />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 flex min-h-screen flex-col overflow-y-auto w-full h-full">
        <Navbar />
        <main className="flex-1 w-full mx-auto max-w-7xl flex flex-col">
          <Outlet />
        </main>
      </div>

      {isAuthModalOpen && <AuthModal />}
      {showPreloader && <Preloader />}
    </div>
  );
}
