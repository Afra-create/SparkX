import { useState } from 'react';
import { X, Calendar as CalIcon, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function ScheduleMeetupModal({ item, onClose }: { item: any; onClose: () => void }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '', time: '', location: 'Main Entrance'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('meetups').insert([{
        item_id: item.id,
        buyer_id: user.id,
        seller_id: item.seller_id,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: 'scheduled'
      }]);

      if (error) throw error;
      toast.success('Meetup scheduled successfully!');
      
      // Also send a notification to seller natively
      await supabase.from('notifications').insert([{
        user_id: item.seller_id,
        type: 'meetup',
        content: `A buyer scheduled a meetup for ${item.title} on ${formData.date} at ${formData.location}.`
      }]);

      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule meetup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="liquid-glass relative z-10 w-full max-w-sm rounded-2xl p-6 sm:p-8 animate-fade-rise">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer">
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-2xl text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>Plan a Meetup</h2>
        <p className="mb-6 text-sm text-muted-foreground line-clamp-1">for {item.title}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><CalIcon className="w-4 h-4"/> Date</label>
            <input required type="date" min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground focus:outline-none focus:border-foreground/40 color-scheme-[dark]" />
          </div>
          
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4"/> Time</label>
            <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground focus:outline-none focus:border-foreground/40 color-scheme-[dark]" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4"/> Campus Location</label>
            <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground appearance-none focus:outline-none focus:border-foreground/40">
              <option value="Main Entrance" className="bg-black">Main Entrance</option>
              <option value="Library" className="bg-black">Library</option>
              <option value="Block A Canteen" className="bg-black">Block A Canteen</option>
              <option value="Sports Complex" className="bg-black">Sports Complex</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center rounded-lg bg-foreground text-background font-medium py-3 text-sm transition-transform hover:scale-[1.02] mt-6 disabled:opacity-50 cursor-pointer">
            {loading ? 'Confirming...' : 'Schedule Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
