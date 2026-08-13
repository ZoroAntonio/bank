import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface TaxWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  label: string;
  symbol?: string;
  network?: string;
  payment_uri?: string;
  created_at: string;
}

export function useTaxWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<TaxWallet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from('tax_wallet_addresses')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      setWallet(null);
    } else if (data) {
      setWallet({
        ...(data as TaxWallet),
        wallet_address: String(data.wallet_address || '').trim(),
        symbol: String(data.symbol || '').trim().toUpperCase(),
        network: String(data.network || '').trim(),
        payment_uri: String(data.payment_uri || '').trim(),
      });
    } else {
      setWallet(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`tax-wallet-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tax_wallet_addresses',
          filter: `user_id=eq.${user.id}`,
        },
        () => void fetchWallet(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchWallet, user]);

  return { wallet, loading };
}
