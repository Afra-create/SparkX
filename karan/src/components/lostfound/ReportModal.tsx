import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function ReportModal({ onClose, onAdded, defaultType = 'lost' }: { onClose: () => void, onAdded: () => void, defaultType?: 'lost' | 'found' }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    record_type: defaultType, title: '', description: '', location: '', date: new Date().toISOString().split('T')[0]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let imageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('lost_found_images')
          .upload(`${user.id}/${fileName}`, imageFile);

        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('lost_found_images').getPublicUrl(`${user.id}/${fileName}`);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.from('lost_found').insert([{
        reporter_id: user.id,
        record_type: formData.record_type,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        images: imageUrl ? [imageUrl] : [],
        status: 'active'
      }]);

      if (error) throw error;
      toast.success(`${formData.record_type === 'lost' ? 'Lost item' : 'Found item'} reported successfully!`);
      onAdded();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to report item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="liquid-glass relative z-10 w-full max-w-lg flex flex-col rounded-2xl animate-fade-rise max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 sm:px-8 sm:py-6 shrink-0 border-b border-white/10">
          <h2 className="text-3xl text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>Report Item</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-6 sm:p-8 space-y-4 bg-black/10 grow">
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                 <input type="radio" value="lost" checked={formData.record_type === 'lost'} onChange={() => setFormData({...formData, record_type: 'lost'})} className="accent-foreground" />
                 I lost something
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                 <input type="radio" value="found" checked={formData.record_type === 'found'} onChange={() => setFormData({...formData, record_type: 'found'})} className="accent-foreground" />
                 I found something
              </label>
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">What is it?</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground focus:outline-none focus:border-foreground/40" placeholder="e.g., Black Hydroflask" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Location</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground focus:outline-none focus:border-foreground/40" placeholder="Block A Canteen" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground appearance-none focus:outline-none focus:border-foreground/40 color-scheme-[dark]" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Additional Details (Color, unique marks)</label>
              <textarea required rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground resize-none focus:outline-none focus:border-foreground/40" />
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Image (Optional)</label>
              <div className="relative flex w-full items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 py-4 hover:bg-white/10 transition-colors">
                 <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer" />
                 <div className="flex flex-col items-center gap-2 text-muted-foreground">
                   <Upload className="h-6 w-6" />
                   <span className="text-sm">{imageFile ? imageFile.name : 'Click to upload'}</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:px-8 sm:py-6 shrink-0 border-t border-white/10">
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-foreground/10 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/20 disabled:opacity-50 cursor-pointer">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
