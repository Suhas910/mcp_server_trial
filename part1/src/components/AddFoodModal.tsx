import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ApiError } from '../api/client';
import type { FoodCategory } from '../types';

interface Props {
  groupId: string;
  onClose: () => void;
}

const CATEGORIES: FoodCategory[] = [
  'Appetizer','Main Course','Dessert','Beverage','Snack',
  'Breakfast','Street Food','Bakery','Seafood','Vegetarian','Other',
];

export function AddFoodModal({ groupId, onClose }: Props) {
  const { addFoodItem } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Main Course');
  const [imageUrl, setImageUrl] = useState('');
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await addFoodItem(groupId, { name: name.trim(), description: description.trim(), category, imageUrl: imageUrl.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add this item. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:22 }}>Add Food Item</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div className="form-group">
            <label className="form-label">Food Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Spicy Tuna Roll"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={80}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={category}
              onChange={e => setCategory(e.target.value as FoodCategory)}
              style={{ cursor:'pointer' }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="What makes this special?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image URL <span style={{ color:'var(--text-muted)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
            <input
              className="form-input"
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setImgError(false); }}
            />
            {imageUrl && !imgError && (
              <div style={{ marginTop:10, borderRadius:10, overflow:'hidden', height:140, background:'var(--bg-elevated)' }}>
                <img
                  src={imageUrl}
                  alt="preview"
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={() => setImgError(true)}
                />
              </div>
            )}
            {imgError && (
              <p style={{ fontSize:12, color:'var(--danger)', marginTop:4 }}>Could not load image — check the URL</p>
            )}
          </div>

          {error && <p style={{ fontSize:13, color:'var(--danger)' }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width:'100%', justifyContent:'center', padding:'13px', marginTop:4, opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Adding…' : 'Add to Group'}
          </button>
        </form>
      </div>
    </div>
  );
}
