import { useEffect, useState } from 'react';
import { Package, MapPin, Calendar, List, Heart, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'listings' | 'reports' | 'meetups' | 'wishlist'>('listings');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      const parseImgs = (arr: any) => { try { return typeof arr === 'string' ? JSON.parse(arr) : (arr || []); } catch { return []; } };

      if (activeTab === 'listings') {
        const res = await fetch(`${API_URL}/marketplace`, { headers });
        const all = await res.json();
        setData((all || []).filter((i: any) => i.ownerId === user?.id).map((i: any) => ({ ...i, images: parseImgs(i.images) })));

      } else if (activeTab === 'reports') {
        const res = await fetch(`${API_URL}/lost-found`, { headers });
        const all = await res.json();
        setData((all || []).filter((i: any) => i.ownerId === user?.id).map((i: any) => ({
          ...i,
          images: parseImgs(i.images),
          record_type: (i.type || '').toLowerCase()
        })));

      } else if (activeTab === 'wishlist') {
        // Read from localStorage — persisted by ItemDetails.tsx toggleWishlist
        try {
          const wl = JSON.parse(localStorage.getItem(`wishlist_${user?.id}`) || '[]');
          setData(wl);
        } catch {
          setData([]);
        }

      } else {
        // meetups not yet in backend
        setData([]);
      }
    } catch {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const markItemAsSold = async (id: string, table: 'marketplace' | 'lost-found') => {
    const statusLabel = table === 'marketplace' ? 'sold' : 'resolved';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/${table}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: statusLabel })
      });
      if (!res.ok) throw new Error();
      toast.success(`Marked as ${statusLabel}! 🎉`);
      fetchData();
    } catch {
      toast.error('Update failed');
    }
  };

  const removeFromWishlist = (id: string) => {
    const key = `wishlist_${user?.id}`;
    try {
      const wl: any[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(wl.filter((w: any) => w.id !== id)));
      setData(prev => prev.filter((w: any) => w.id !== id));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Could not remove item');
    }
  };

  if (!user) return <div className="py-20 text-center text-muted-foreground">Please login to view profile.</div>;

  const tabs = [
    { id: 'listings' as const, label: 'My Listings', icon: <Package className="w-5 h-5" /> },
    { id: 'reports' as const, label: 'Lost & Found', icon: <MapPin className="w-5 h-5" /> },
    { id: 'meetups' as const, label: 'Meetups', icon: <Calendar className="w-5 h-5" /> },
    { id: 'wishlist' as const, label: 'Wishlist', icon: <Heart className="w-5 h-5" /> },
  ];

  return (
    <div className="animate-fade-rise mx-auto w-full max-w-6xl py-12 px-6 flex flex-col md:flex-row gap-12">
      {/* Sidebar */}
      <div className="md:w-1/4 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/5 border border-white/10">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-white/10 mb-4 border-2 border-white/20">
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold uppercase text-muted-foreground">
              {user.email?.charAt(0) || 'U'}
            </div>
          </div>
          <h2 className="text-xl font-medium text-foreground">{user.email?.split('@')[0]}</h2>
          <p className="text-sm text-muted-foreground mt-1">Jain College</p>
        </div>

        <div className="flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer text-left ${
                activeTab === tab.id ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="md:w-3/4 flex flex-col">
        <h1 className="text-4xl text-foreground mb-8" style={{ fontFamily: "'Instrument Serif', serif" }}>
          {tabs.find(t => t.id === activeTab)?.label}
        </h1>

        {loading ? (
          <div className="text-muted-foreground">Loading...</div>

        ) : activeTab === 'meetups' ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed text-muted-foreground gap-4">
            <Calendar className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-center">
              Meetups are coordinated via <strong className="text-foreground">live chat</strong>.<br />
              Click the 📅 Meetup button inside any conversation to propose one!
            </p>
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full bg-foreground/10 text-foreground text-sm hover:bg-foreground/20 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" /> Go to Messages
            </button>
          </div>

        ) : activeTab === 'wishlist' ? (
          data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed text-muted-foreground gap-4">
              <Heart className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-center">
                Tap the ❤️ icon on any marketplace listing<br />to save it to your wishlist.
              </p>
              <button
                onClick={() => navigate('/marketplace')}
                className="flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full bg-foreground/10 text-foreground text-sm hover:bg-foreground/20 transition-colors cursor-pointer"
              >
                <Package className="w-4 h-4" /> Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {data.map((item: any) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors items-center">
                  {item.images?.[0] && (
                    <img src={item.images[0]} alt={item.title} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-foreground truncate">{item.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {item.price === 0 ? <span className="text-emerald-400">FREE</span> : `₹${item.price}`}
                      {item.category ? ` • ${item.category}` : ''}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="px-3 py-2 text-xs font-medium bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="px-3 py-2 text-xs font-medium bg-red-500/20 text-red-300 border border-red-400/30 rounded-lg hover:bg-red-500/30 cursor-pointer"
                    >
                      ❤️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )

        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed text-muted-foreground">
            <List className="w-10 h-10 mb-4 opacity-50" />
            <p>Nothing here yet.</p>
          </div>

        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors items-center">
                {item.images?.[0] && (
                  <img src={item.images[0]} alt={item.title} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                )}
                {activeTab === 'listings' && (
                  <>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-foreground truncate">{item.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        {item.price === 0
                          ? <span className="text-emerald-400">FREE (Donation)</span>
                          : `₹${item.price}`}
                        {' • '}<span className="capitalize">{item.condition}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => markItemAsSold(item.id, 'marketplace')}
                      className="shrink-0 px-4 py-2 text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg hover:bg-emerald-500/30 cursor-pointer"
                    >
                      ✅ Mark Sold
                    </button>
                  </>
                )}
                {activeTab === 'reports' && (
                  <>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-foreground truncate">
                        {item.title}
                        <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${item.record_type === 'found' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                          {item.record_type?.toUpperCase()}
                        </span>
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {item.location} • {item.date ? new Date(item.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => markItemAsSold(item.id, 'lost-found')}
                      className="shrink-0 px-4 py-2 text-xs font-medium bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 cursor-pointer"
                    >
                      ✅ Resolved
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
