import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useWishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setIds(new Set()); return; }
    let active = true;
    supabase.from('wishlists').select('listing_id').eq('user_id', user.id).then(({ data }) => {
      if (active && data) setIds(new Set(data.map((r: { listing_id: string }) => r.listing_id)));
    });
    return () => { active = false; };
  }, [user]);

  const toggle = useCallback(async (listingId: string) => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    const has = ids.has(listingId);
    setIds(prev => { const n = new Set(prev); if (has) n.delete(listingId); else n.add(listingId); return n; });
    const { error } = has
      ? await supabase.from('wishlists').delete().eq('user_id', user.id).eq('listing_id', listingId)
      : await supabase.from('wishlists').insert({ user_id: user.id, listing_id: listingId });
    if (error) {
      setIds(prev => { const n = new Set(prev); if (has) n.add(listingId); else n.delete(listingId); return n; });
    }
  }, [user, ids, navigate, location]);

  return { ids, toggle };
}
