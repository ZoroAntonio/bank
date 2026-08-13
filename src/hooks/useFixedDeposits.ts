import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getCryptoPaymentRequest } from '../lib/cryptoPayment';

export interface CryptoDeposit {
  id: string;
  user_id: string;
  symbol: string;
  crypto_name: string;
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'failed';
  wallet_id?: string | null;
  wallet_address?: string;
  network?: string;
  payment_uri?: string;
  created_at: string;
}

export function useAddFund() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeposits = useCallback(async () => {
    if (!user) {
      setDeposits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('crypto_deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setDeposits((data as CryptoDeposit[]) || []);
    setLoading(false);
  }, [user]);

  const addFund = async (params: { walletId: string; symbol: string; amount: number }) => {
    if (!user) return { error: 'Not authenticated' };

    const { data: wallet, error: walletError } = await supabase
      .from('crypto_wallets')
      .select('id, user_id, symbol, name, wallet_address, network, payment_uri')
      .eq('id', params.walletId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (walletError || !wallet || String(wallet.symbol).trim().toUpperCase() !== params.symbol.trim().toUpperCase()) {
      return { error: 'Deposit wallet unavailable' };
    }

    const paymentRequest = getCryptoPaymentRequest(wallet);
    if (!paymentRequest.valid) {
      return { error: paymentRequest.error || 'Deposit wallet unavailable' };
    }

    const { error: insertErr } = await supabase.from('crypto_deposits').insert({
      user_id: user.id,
      symbol: String(wallet.symbol).trim().toUpperCase(),
      crypto_name: String(wallet.name || wallet.symbol).trim(),
      amount: params.amount,
      status: 'pending',
      wallet_id: wallet.id,
      wallet_address: paymentRequest.address,
      network: String(wallet.network || '').trim(),
      payment_uri: paymentRequest.payload,
    });
    if (insertErr) return { error: insertErr.message };

    await fetchDeposits();
    return { error: null };
  };

  useEffect(() => {
    void fetchDeposits();
  }, [fetchDeposits]);

  return { deposits, loading, refetch: fetchDeposits, addFund };
}
