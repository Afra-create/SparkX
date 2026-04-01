import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Calendar, ArrowLeft, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import ScheduleMeetupModal from '../components/meetup/ScheduleMeetupModal';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuthStore();
  
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMeetupModalOpen, setIsMeetupModalOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);

  // Helper: get/set wishlist from localStorage
  function getWishlist(): any[] {
    try { return JSON.parse(localStorage.getItem(`wishlist_${user?.id}`) || '[]'); } catch { return []; }
  }
  function saveWishlist(items: any[]) {
    localStorage.setItem(`wishlist_${user?.id}`, JSON.stringify(items));
  }

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  async function fetchItemDetails() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select(`*, users(full_name, avatar_url)`)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setItem(data);

      // Check localStorage wishlist
      if (user && data) {
        const wl = getWishlist();
        setIsWishlisted(wl.some((w: any) => w.id === data.id));
      }
    } catch (error) {
      toast.error('Item not found');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  }

  const toggleWishlist = () => {
    if (!user) return openAuthModal();
    const wl = getWishlist();
    if (isWishlisted) {
      saveWishlist(wl.filter((w: any) => w.id !== item.id));
      setIsWishlisted(false);
      toast.success('Removed from wishlist');
    } else {
      // Save a snapshot of the item so Profile can display it without re-fetching
      saveWishlist([...wl, {
        id: item.id,
        title: item.title,
        price: item.price,
        category: item.category,
        condition: item.condition,
        images: item.images || []
      }]);
      setIsWishlisted(true);
      toast.success('Added to wishlist ❤️');
    }
  };

  const handleContact = async () => {
    if (!user) return openAuthModal();
    const targetUserId = item.ownerId || item.seller_id;
    if (user.id === targetUserId) return toast.error("You can't message yourself.");
    navigate(`/chat/${targetUserId}`);
  };

  const markAsSold = async () => {
    if (!user || (user.id !== item.ownerId && user.id !== item.seller_id)) return;
    setMarkingSold(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/marketplace/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'sold' })
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Item marked as sold! 🎉');
      navigate('/marketplace');
    } catch {
      toast.error('Could not update item status');
    } finally {
      setMarkingSold(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading item details...</div>;
  if (!item) return null;

  return (
    <div className="animate-fade-rise mx-auto w-full max-w-5xl py-12 px-6">
      <button onClick={() => navigate('/marketplace')} className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Marketplace
      </button>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {item.images && item.images.length > 0 ? (
              <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">No Image Available</div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col p-4 md:p-0">
          <div className="flex items-start justify-between">
            <h1 className="text-4xl font-normal text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {item.title}
            </h1>
            <button onClick={toggleWishlist} className={`p-2 rounded-full border ml-4 transition-colors cursor-pointer shrink-0 ${isWishlisted ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/10'}`}>
              <Heart className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
          
          {item.price === 0 ? (
            <div className="mt-4 inline-block">
              <span className="text-2xl font-light text-emerald-400">FREE</span>
              <span className="ml-2 text-sm text-muted-foreground">Donation</span>
            </div>
          ) : (
            <h2 className="mt-4 text-3xl font-light text-foreground">₹{item.price}</h2>
          )}
          
          <div className="mt-6 flex items-center gap-4">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-muted-foreground uppercase tracking-wider">{item.category}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-muted-foreground uppercase tracking-wider">{item.condition}</span>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-foreground tracking-wide uppercase">Description</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">{item.description}</p>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Seller Details</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-white/10">
                {item.users?.avatar_url ? (
                  <img src={item.users.avatar_url} alt="Seller" className="h-full w-full object-cover" />
                ) : (
                   <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-muted-foreground bg-white/5">{(item.users?.full_name || 'U').charAt(0)}</div>
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{item.users?.full_name || 'Anonymous User'}</p>
                <p className="text-sm text-muted-foreground">Jain College</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            {user && (user.id === item.ownerId || user.id === item.seller_id) ? (
              <button
                onClick={markAsSold}
                disabled={markingSold}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 py-4 font-medium transition-all hover:bg-emerald-500/30 cursor-pointer disabled:opacity-50"
              >
                {markingSold ? 'Updating...' : '✅ Mark as Sold / Donated'}
              </button>
            ) : (
              <>
                <button 
                  onClick={handleContact}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground text-background py-4 font-medium transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contact Seller
                </button>
                <button 
                  onClick={() => user ? setIsMeetupModalOpen(true) : openAuthModal()}
                  className="liquid-glass flex flex-1 items-center justify-center gap-2 rounded-xl py-4 font-medium text-foreground transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <Calendar className="h-5 w-5" />
                  Schedule Meetup
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isMeetupModalOpen && (
        <ScheduleMeetupModal 
          item={item} 
          onClose={() => setIsMeetupModalOpen(false)} 
        />
      )}
    </div>
  );
}
