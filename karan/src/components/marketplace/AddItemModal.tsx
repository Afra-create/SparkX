import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function AddItemModal({ onClose, onAdded }: { onClose: () => void, onAdded: () => void }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isDonation, setIsDonation] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', category: 'Textbooks', condition: 'Good'
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
          .from('items_images')
          .upload(`${user.id}/${fileName}`, imageFile);

        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('items_images').getPublicUrl(`${user.id}/${fileName}`);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.from('items').insert([{
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        price: isDonation ? 0 : parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        images: imageUrl ? [imageUrl] : [],
        status: 'active'
      }]);

      if (error) throw error;
      toast.success('Item listed successfully!');
      onAdded();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to list item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="liquid-glass relative z-10 w-full max-w-lg flex flex-col rounded-2xl animate-fade-rise max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 sm:px-8 sm:py-6 shrink-0 border-b border-white/10">
          <h2 className="text-3xl text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>Sell an Item</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-6 sm:p-8 space-y-4 bg-black/10 grow">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground focus:outline-none focus:border-foreground/40" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 flex justify-between items-center text-sm text-muted-foreground">
                   Price (₹) 
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-foreground bg-white/10 px-2 py-0.5 rounded-full">Donate</span>
                     <input type="checkbox" checked={isDonation} onChange={e => { setIsDonation(e.target.checked); if (e.target.checked) setFormData({...formData, price: '0'}); }} className="accent-foreground w-4 h-4 cursor-pointer" />
                   </div>
                </label>
                <input required={!isDonation} disabled={isDonation} type="number" min="0" step="1" value={isDonation ? 0 : formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground focus:outline-none focus:border-foreground/40 disabled:opacity-50" placeholder="e.g., 500" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Condition</label>
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground appearance-none focus:outline-none focus:border-foreground/40">
                  <option value="Like New" className="bg-black">Like New</option>
                  <option value="Good" className="bg-black">Good</option>
                  <option value="Fair" className="bg-black">Fair</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground appearance-none focus:outline-none focus:border-foreground/40">
                <option value="Textbooks" className="bg-black">Textbooks</option>
                <option value="Electronics" className="bg-black">Electronics</option>
                <option value="Furniture" className="bg-black">Furniture</option>
                <option value="Lab Coats" className="bg-black text-blue-400">Lab Coats / Academic</option>
                <option value="Drafters" className="bg-black text-blue-400">Drafters / Tools</option>
                <option value="Other" className="bg-black">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Description</label>
              <textarea required rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-foreground resize-none focus:outline-none focus:border-foreground/40" />
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Image</label>
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
              {loading ? 'Posting...' : 'Post Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
