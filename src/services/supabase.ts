import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Quotation } from '../types/quotation';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Checks if Supabase credentials are configured in the environment.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey !== 'your-anon-public-key' &&
    supabaseUrl.startsWith('https://')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Transforms a Quotation model into a Supabase relational row with JSONB fields.
 */
export function quotationToRow(q: Quotation) {
  return {
    id: q.correlativeNumber,
    correlative_number: q.correlativeNumber,
    correlative_counter: q.correlativeCounter,
    date: q.date,
    time: q.time,
    validity_days: q.validityDays,
    delivery_time: q.deliveryTime,
    payment_method: q.paymentMethod,
    warranty: q.warranty,
    currency: q.currency,
    currency_symbol: q.currencySymbol,
    observations: q.observations,
    client: q.client,
    issuer: q.issuer,
    items: q.items,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
  };
}

/**
 * Transforms a Supabase row into our application's Quotation object.
 */
export function rowToQuotation(row: any): Quotation {
  return {
    id: row.id || row.correlative_number,
    correlativeNumber: row.correlative_number,
    correlativeCounter: row.correlative_counter,
    date: row.date,
    time: row.time,
    validityDays: row.validity_days,
    deliveryTime: row.delivery_time,
    paymentMethod: row.payment_method,
    warranty: row.warranty,
    currency: row.currency,
    currencySymbol: row.currency_symbol,
    observations: row.observations,
    client: row.client,
    issuer: row.issuer,
    items: row.items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Saves a quotation to Supabase (using upsert so existing records are updated).
 */
export async function saveQuotationToSupabase(quotation: Quotation): Promise<boolean> {
  if (!supabase) return false;

  try {
    const row = quotationToRow(quotation);
    const { error } = await supabase
      .from('quotations')
      .upsert(row, { onConflict: 'correlative_number' });

    if (error) {
      console.warn('Supabase save error:', error.message);
      return false;
    }
    console.log(`Cotización ${quotation.correlativeNumber} guardada exitosamente en Supabase.`);
    return true;
  } catch (err) {
    console.warn('Error conectando con Supabase para guardar:', err);
    return false;
  }
}

/**
 * Retrieves all stored quotations from Supabase ordered by last updated.
 */
export async function getQuotationsFromSupabase(): Promise<Quotation[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    if (!data) return [];
    return data.map(rowToQuotation);
  } catch (err) {
    console.warn('Error consultando Supabase:', err);
    return null;
  }
}

/**
 * Deletes a quotation from Supabase by correlative number.
 */
export async function deleteQuotationFromSupabase(correlativeNumber: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('correlative_number', correlativeNumber);

    if (error) {
      console.warn('Supabase delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error eliminando de Supabase:', err);
    return false;
  }
}
