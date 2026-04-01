import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, openAuthModal, signOut } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    
    const channel = supabase.channel('nav_notifs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
      setUnreadCount(prev => prev + 1);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <nav className="relative z-[60] mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-8 py-6">
      <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-[1.02]">
        <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/5 border border-white/10 p-1 backdrop-blur-sm">
          <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
        </div>
        <span 
          style={{ fontFamily: "'Instrument Serif', serif" }} 
          className="text-2xl md:text-3xl tracking-tight text-foreground"
        >
          Campus Nexus<sup className="text-[10px] opacity-40 italic ml-0.5">pk</sup>
        </span>
      </Link>
      <div className="hidden items-center space-x-8 md:flex">
        <Link to="/" className="text-sm text-foreground transition-colors hover:text-foreground">Home</Link>
        <Link to="/marketplace" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Marketplace</Link>
        <Link to="/lost-found" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Lost & Found</Link>
      </div>
      <div className="flex items-center space-x-6">
        {user ? (
           <div className="flex items-center space-x-6">
             <Link to="/profile" className="relative text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors">
               <Bell className="h-4 w-4" />
               {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-black font-semibold text-[8px]">{unreadCount}</span>}
             </Link>
             <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground flex items-center space-x-1 transition-colors">
               <UserIcon className="h-4 w-4" />
               <span className="hidden sm:inline">Profile</span>
             </Link>
             <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground flex items-center space-x-1 transition-colors cursor-pointer">
               <LogOut className="h-4 w-4" />
               <span className="hidden sm:inline">Logout</span>
             </button>
           </div>
        ) : (
          <button onClick={openAuthModal} className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground transition-transform hover:scale-[1.03] cursor-pointer">
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
