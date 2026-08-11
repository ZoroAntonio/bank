import { supabase } from './supabase';

export type CrmIpAccessStatus = {
  allowed: boolean;
  current_ip: string | null;
  ip_check_enabled: boolean;
  enforcement_enabled: boolean;
};

export type CrmIpWhitelistEntry = {
  id: string;
  ip_address: string;
  label: string;
  created_at: string;
  created_by: string | null;
};

type FunctionErrorBody = {
  error?: string;
};

async function callCrmIpAccess<T>(body: Record<string, unknown>): Promise<T> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Your session has expired. Sign in again.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(`${supabaseUrl}/functions/v1/crm-ip-access`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as T & FunctionErrorBody;
  if (!response.ok) {
    throw new Error(data.error || `IP access request failed (${response.status}).`);
  }

  return data;
}

export function checkCrmIpAccess() {
  return callCrmIpAccess<CrmIpAccessStatus>({ action: 'status' });
}

export function listCrmIpWhitelist() {
  return callCrmIpAccess<
    CrmIpAccessStatus & { entries: CrmIpWhitelistEntry[] }
  >({ action: 'list' });
}

export function addCrmIpWhitelistEntry(ipAddress: string, label: string) {
  return callCrmIpAccess<{ entry: CrmIpWhitelistEntry }>({
    action: 'add',
    ip_address: ipAddress,
    label,
  });
}

export function deleteCrmIpWhitelistEntry(id: string) {
  return callCrmIpAccess<{ success: boolean }>({ action: 'delete', id });
}

export function setCrmIpCheckEnabled(enabled: boolean) {
  return callCrmIpAccess<{
    success: boolean;
    ip_check_enabled: boolean;
    enforcement_enabled: boolean;
  }>({ action: 'set_enabled', enabled });
}
