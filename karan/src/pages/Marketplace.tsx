import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import AddItemModal from '../components/marketplace/AddItemModal';

interface Item {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  created_at: string;
}

export default function Marketplace() {
  const { user, openAuthModal } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [donationsOnly, setDonationsOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [searchQuery, category, condition, donationsOnly]);

  async function fetchItems() {
    try {
      setLoading(true);
      let query = supabase.from('items').select('*').eq('status', 'active');

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      if (category !== 'All') {
        query = query.eq('category', category);
      }
      if (condition !== 'All') {
        query = query.eq('condition', condition);
      }
      if (donationsOnly) {
        query = query.eq('price', 0);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error('Could not load marketplace items');
    } finally {
      setLoading(false);
    }
  }

  const handleSellClick = () => {
    if (!user) {
      toast('Please login to sell an item', { icon: '🔒' });
      openAuthModal();
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-rise flex-1 py-12 px-6">
      <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl font-normal text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Marketplace
          </h1>
          <p className="mt-2 text-muted-foreground">Peer-to-peer trading for Jain College</p>
        </div>
        
        <button 
          onClick={handleSellClick}
          className="liquid-glass flex items-center gap-2 rounded-full px-6 py-2.5 text-sm transition-transform hover:scale-[1.03] cursor-pointer text-foreground"
        >
          <Plus className="h-4 w-4" />
          <span>Post Item</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full bg-white/5 border border-white/10 py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/40"
          />
        </div>
        
        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-foreground focus:outline-none appearance-none"
        >
          <option value="All" className="bg-black">All Categories</option>
          <option value="Textbooks" className="bg-black">Textbooks</option>
          <option value="Electronics" className="bg-black">Electronics</option>
          <option value="Furniture" className="bg-black">Furniture</option>
          <option value="Lab Coats" className="bg-black">Lab Coats / Academic</option>
          <option value="Drafters" className="bg-black">Drafters / Tools</option>
          <option value="Other" className="bg-black">Other</option>
        </select>

        <button
          onClick={() => setDonationsOnly(!donationsOnly)}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-all cursor-pointer border ${
            donationsOnly
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
              : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
          }`}
        >
          ♻️ Donations
        </button>

        <select 
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-foreground focus:outline-none appearance-none"
        >
          <option value="All" className="bg-black">Condition: Any</option>
          <option value="Like New" className="bg-black">Like New</option>
          <option value="Good" className="bg-black">Good</option>
          <option value="Fair" className="bg-black">Fair</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">No items found.</p>
          <p className="text-sm">Try adjusting your filters or be the first to sell something!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Link 
              key={item.id} 
              to={`/item/${item.id}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="aspect-square bg-white/5 w-full overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">No Image</div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-foreground line-clamp-1">{item.title}</h3>
                  {item.price === 0 ? (
                    <span className="font-semibold text-emerald-400 ml-3 text-xs bg-emerald-400/10 border border-emerald-400/30 rounded-full px-2 py-0.5">FREE</span>
                  ) : (
                    <span className="font-semibold text-foreground ml-3">₹{item.price}</span>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <span className="rounded-full bg-white/10 px-2 py-1">{item.category}</span>
                  <span>{item.condition}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {isModalOpen && (
        <AddItemModal 
          onClose={() => setIsModalOpen(false)} 
          onAdded={fetchItems} 
        />
      )}
    </div>
  );
}
