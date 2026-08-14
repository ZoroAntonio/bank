import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: string;
  description: string;
  reference: string;
  notes: string;
  status: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
  show_account_created_at: boolean;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    const normalized = ((data as Array<Partial<Transaction> & Record<string, unknown>>) || []).map((row) => ({
      id: String(row.id || ''),
      user_id: String(row.user_id || ''),
      type: String(row.type || ''),
      amount: String(row.amount ?? row.details ?? ''),
      description: String(row.description ?? row.comment ?? ''),
      reference: String(row.reference ?? row.poi ?? row.reference_number ?? ''),
      notes: String(row.notes ?? ''),
      status: String(row.status || 'completed'),
      created_at: String(row.created_at || ''),
    }));
    setTransactions(normalized);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, refetch: fetchTransactions };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) await fetchProfile();
    return { error: error?.message || null };
  };

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
