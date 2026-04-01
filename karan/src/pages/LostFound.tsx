import { useState, useEffect } from 'react';
import { MapPin, Eye, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ReportModal from '../components/lostfound/ReportModal';

export default function LostFound() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
  const [items, setItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [markingResolved, setMarkingResolved] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  async function fetchReports() {
    try {
      setLoading(true);
      // Fetch ALL items for the smart matching engine
      const { data: rawData } = await supabase
        .from('lost_found')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Normalize: backend stores type as "FOUND"/"LOST" uppercase; activeTab is lowercase
      const allData = (rawData || []).map((i: any) => ({
        ...i,
        record_type: (i.type || i.record_type || '').toLowerCase()
      }));

      setAllItems(allData);
      setItems(allData.filter((i: any) => i.record_type === activeTab));
    } catch (error: any) {
      toast.error('Could not load reports');
    } finally {
      setLoading(false);
    }
  }

  // Smart Registry fuzzy matching engine
  function getSmartMatches(item: any): any[] {
    if (!item) return [];
    const oppositeType = item.record_type === 'lost' ? 'found' : 'lost';
    const candidates = allItems.filter(i => i.record_type === oppositeType);
    const keywords = [...(item.title || '').split(' '), ...(item.description || '').split(' '), item.location || '']
      .map((w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter((w: string) => w.length > 3);
    return candidates
      .map((candidate: any) => {
        const candidateText = `${candidate.title} ${candidate.description} ${candidate.location}`.toLowerCase();
        const matchScore = keywords.filter((kw: string) => candidateText.includes(kw)).length;
        return { ...candidate, matchScore };
      })
      .filter((c: any) => c.matchScore > 0)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }

  async function markResolved(item: any) {
    if (!user || user.id !== item.ownerId) return;
    setMarkingResolved(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/lost-found/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'resolved' })
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Marked as Recovered! Great news! 🎉');
      setSelectedItem(null);
      fetchReports();
    } catch {
      toast.error('Could not update status');
    } finally {
      setMarkingResolved(false);
    }
  }

  const handleReportClick = () => {
    if (!user) {
      toast('Please login to report an item', { icon: '🔒' });
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
            Lost & Found
          </h1>
          <p className="mt-2 text-muted-foreground">Report and recover items on campus</p>
        </div>
        
        <button 
          onClick={handleReportClick}
          className="liquid-glass flex items-center gap-2 rounded-full px-6 py-2.5 text-sm transition-transform hover:scale-[1.03] cursor-pointer text-foreground"
        >
          <Upload className="h-4 w-4" />
          <span>Report Item</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-4">
        <button 
          onClick={() => setActiveTab('lost')}
          className={`flex-1 sm:flex-none rounded-full px-8 py-2.5 text-sm transition-all cursor-pointer ${
            activeTab === 'lost' ? 'bg-foreground text-background font-medium' : 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10'
          }`}
        >
          Lost Items
        </button>
        <button 
          onClick={() => setActiveTab('found')}
          className={`flex-1 sm:flex-none rounded-full px-8 py-2.5 text-sm transition-all cursor-pointer ${
            activeTab === 'found' ? 'bg-foreground text-background font-medium' : 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10'
          }`}
        >
          Found Items
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading reports...</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">No {activeTab} items reported currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="group flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 text-left w-full cursor-pointer"
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white/5 relative">
                 {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/50"><Eye className="h-6 w-6 opacity-50"/></div>
                )}
              </div>
              <div className="flex flex-col flex-1 pb-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-foreground line-clamp-1">{item.title}</h3>
                  <span className="text-xs shrink-0 text-muted-foreground ml-3">{new Date(item.date).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground pt-3">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{item.location}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {isModalOpen && (
        <ReportModal 
          onClose={() => setIsModalOpen(false)} 
          onAdded={fetchReports} 
          defaultType={activeTab}
        />
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="liquid-glass relative z-10 w-full max-w-lg flex flex-col rounded-2xl animate-fade-rise max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-white/10 shrink-0">
              <h2 className="text-2xl text-foreground font-medium" style={{ fontFamily: "'Instrument Serif', serif" }}>Item Details</h2>
              <button type="button" onClick={() => setSelectedItem(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 sm:p-8 grow">
              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 bg-white/5">
                   <img src={selectedItem.images[0]} className="w-full h-full object-cover" alt={selectedItem.title} />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-medium text-foreground">{selectedItem.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ml-2 shrink-0 ${selectedItem.record_type === 'lost' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'}`}>
                  {selectedItem.record_type?.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedItem.record_type === 'found' ? 'Found' : 'Lost'} at: <span className="text-foreground">{selectedItem.location}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>Date: <span className="text-foreground">{new Date(selectedItem.date).toLocaleDateString()}</span></span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground leading-relaxed mb-6">
                 <h4 className="text-foreground font-medium mb-1 uppercase tracking-wider text-xs">Description</h4>
                 <p className="whitespace-pre-wrap">{selectedItem.description}</p>
              </div>

              {/* Smart Registry Matching Engine */}
              {(() => {
                const matches = getSmartMatches(selectedItem);
                if (matches.length === 0) return null;
                return (
                  <div className="mt-4 rounded-xl border border-violet-400/30 bg-violet-500/10 p-4">
                    <h4 className="text-xs uppercase tracking-wider text-violet-300 font-semibold mb-3 flex items-center gap-2">
                      <span>🔮</span> Smart Registry — Possible Matches
                    </h4>
                    <div className="space-y-2">
                      {matches.map((match: any) => (
                        <button
                          key={match.id}
                          onClick={() => setSelectedItem(match)}
                          className="w-full text-left flex items-center gap-3 rounded-lg bg-white/5 hover:bg-white/10 p-3 transition-colors cursor-pointer"
                        >
                          {match.images?.[0] ? (
                            <img src={match.images[0]} className="h-10 w-10 rounded-lg object-cover shrink-0" alt={match.title} />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-lg">📦</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{match.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{match.location}</p>
                          </div>
                          <span className="ml-auto text-xs text-violet-300 shrink-0">{match.matchScore} match{match.matchScore !== 1 ? 'es' : ''}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 sm:px-8 shrink-0 border-t border-white/10 bg-black/20 space-y-2">
              {user && user.id === selectedItem.ownerId && (
                <button
                  onClick={() => markResolved(selectedItem)}
                  disabled={markingResolved}
                  className="w-full rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 py-2.5 text-sm font-medium transition-all hover:bg-emerald-500/30 cursor-pointer disabled:opacity-50"
                >
                  {markingResolved ? 'Updating...' : '✅ Mark as Recovered'}
                </button>
              )}
              <button 
                onClick={() => {
                  if (!user) { toast('Please login', { icon: '🔒' }); }
                  else if (user.id === selectedItem.ownerId) { toast.error("This is your report"); }
                  else { navigate(`/chat/${selectedItem.ownerId}`); }
                }}
                className="w-full rounded-lg bg-foreground text-background py-3 text-sm font-medium transition-transform hover:scale-[1.02] cursor-pointer"
              >
                Contact {selectedItem.record_type === 'lost' ? 'Reporter' : 'Finder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
