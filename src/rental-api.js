import { supabase } from './supabase';

const requireClient = () => { if (!supabase) throw new Error('Connect Supabase before using live data.'); return supabase; };

export async function getListings(filters = {}) {
  let query = requireClient().from('listings').select('*, listing_photos(url,alt_text,position), reviews(rating)').eq('published', true);
  if (filters.city && filters.city !== 'Anywhere') query = query.eq('city', filters.city);
  if (filters.propertyType && filters.propertyType !== 'Any type') query = query.eq('property_type', filters.propertyType);
  if (filters.instantBook) query = query.eq('instant_book', true);
  if (filters.maxNightlyCents) query = query.lte('nightly_cents', filters.maxNightlyCents);
  const { data, error } = await query.order('created_at'); if (error) throw error; return data;
}

export async function checkAvailability(listingId, checkIn, checkOut) {
  const { data, error } = await requireClient().rpc('listing_is_available', { p_listing_id: listingId, p_check_in: checkIn, p_check_out: checkOut });
  if (error) throw error; return data;
}

export async function createBooking(listingId, checkIn, checkOut, guests) {
  const { data, error } = await requireClient().rpc('book_listing', { p_listing_id: listingId, p_check_in: checkIn, p_check_out: checkOut, p_guests: guests });
  if (error) throw error; return data;
}

export async function beginPayment(bookingId) {
  const { data, error } = await requireClient().functions.invoke('create-payment-intent', { body: { bookingId } });
  if (error) throw error; if (data.error) throw new Error(data.error); return data.clientSecret;
}

export async function updateProfile({ full_name, phone }) {
  const client = requireClient(); const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Please sign in.'); const { error } = await client.from('profiles').update({ full_name, phone }).eq('id', user.id); if (error) throw error;
}
