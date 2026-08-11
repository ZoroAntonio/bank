import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Globe2,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  addCrmIpWhitelistEntry,
  deleteCrmIpWhitelistEntry,
  listCrmIpWhitelist,
  setCrmIpCheckEnabled,
  type CrmIpWhitelistEntry,
} from '../../lib/crmIpAccess';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function IpWhitelistCard() {
  const [entries, setEntries] = useState<CrmIpWhitelistEntry[]>([]);
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [ipCheckEnabled, setIpCheckEnabled] = useState(true);
  const [enforcementEnabled, setEnforcementEnabled] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await listCrmIpWhitelist();
      setEntries(result.entries);
      setCurrentIp(result.current_ip);
      setIpCheckEnabled(result.ip_check_enabled);
      setEnforcementEnabled(result.enforcement_enabled);
      setIpAddress((current) => current || (result.entries.length === 0 ? result.current_ip ?? '' : ''));
    } catch (error) {
      setMessage({ kind: 'error', text: getErrorMessage(error, 'Could not load the IP whitelist.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ipAddress.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      await addCrmIpWhitelistEntry(ipAddress.trim(), label.trim());
      setIpAddress('');
      setLabel('');
      await loadEntries();
      setMessage({ kind: 'success', text: 'IP address added to the CRM whitelist.' });
    } catch (error) {
      setMessage({ kind: 'error', text: getErrorMessage(error, 'Could not add that IP address.') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: CrmIpWhitelistEntry) {
    setDeletingId(entry.id);
    setMessage(null);

    try {
      await deleteCrmIpWhitelistEntry(entry.id);
      await loadEntries();
      setMessage({ kind: 'success', text: 'IP address removed from the CRM whitelist.' });
    } catch (error) {
      setMessage({ kind: 'error', text: getErrorMessage(error, 'Could not remove that IP address.') });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleIpCheck() {
    setToggling(true);
    setMessage(null);

    try {
      const nextEnabled = !ipCheckEnabled;
      await setCrmIpCheckEnabled(nextEnabled);
      await loadEntries();
      setMessage({
        kind: 'success',
        text: nextEnabled
          ? 'IP checking is on. Only whitelisted addresses can access the CRM.'
          : 'IP checking is off. CRM staff can now access from any IP address.',
      });
    } catch (error) {
      setMessage({ kind: 'error', text: getErrorMessage(error, 'Could not change the IP check setting.') });
    } finally {
      setToggling(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-[#006446]/14 bg-white shadow-[0_24px_60px_-48px_rgba(0,100,70,0.45)]">
      <div className="border-b border-[#006446]/10 px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#006446]/10 text-[#006446]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#006446]">Access security</p>
              <h2 className="mt-1 text-2xl font-serif font-bold text-slate-950">CRM IP whitelist</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {ipCheckEnabled
                  ? 'Only signed-in CRM staff connecting from an address below can open the CRM admin area.'
                  : 'IP checking is currently off. Signed-in CRM staff can connect from any IP address.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleToggleIpCheck()}
              disabled={loading || toggling}
              aria-pressed={ipCheckEnabled}
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                ipCheckEnabled
                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {ipCheckEnabled ? 'Turn off IP check' : 'Turn on IP check'}
            </button>
            <button
              type="button"
              onClick={() => void loadEntries()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#006446]/12 px-4 py-2 text-sm font-medium text-[#006446] transition-colors hover:bg-[#006446]/[0.05] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#006446]/10 bg-[#f7fbf8] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Globe2 className="h-5 w-5 text-[#006446]" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Your current IP</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{currentIp || 'Unavailable'}</p>
            </div>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${
            !ipCheckEnabled
              ? 'border-slate-200 bg-slate-100 text-slate-700'
              : enforcementEnabled
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            {!ipCheckEnabled ? 'IP check off' : enforcementEnabled ? 'Whitelist enforced' : 'Setup required'}
          </span>
        </div>

        {!ipCheckEnabled && !loading && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              The saved whitelist is not being enforced. Every IP address is allowed, but users must still sign in with a CRM staff account.
            </p>
          </div>
        )}

        {ipCheckEnabled && !enforcementEnabled && !loading && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Access remains open to signed-in CRM staff until the first entry is saved. For safety, the first entry must be your current IP address.
            </p>
          </div>
        )}

        {message && (
          <div className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            message.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 bg-[#f7fbf8] p-5 sm:p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={handleAdd} className="h-fit rounded-[24px] border border-[#006446]/12 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-950">Allow an IP address</h3>
          <p className="mt-1 text-sm text-slate-500">Add one exact IPv4 or IPv6 address at a time.</p>

          <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="crm-ip-address">
            IP address
          </label>
          <input
            id="crm-ip-address"
            value={ipAddress}
            onChange={(event) => setIpAddress(event.target.value)}
            placeholder="203.0.113.10 or 2001:db8::1"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded-2xl border border-[#006446]/14 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:border-[#006446]/35 focus:ring-2 focus:ring-[#006446]/15"
          />

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="crm-ip-label">
            Label <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="crm-ip-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Berlin office"
            maxLength={100}
            className="mt-2 w-full rounded-2xl border border-[#006446]/14 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#006446]/35 focus:ring-2 focus:ring-[#006446]/15"
          />

          {currentIp && ipAddress !== currentIp && (
            <button
              type="button"
              onClick={() => setIpAddress(currentIp)}
              className="mt-3 text-sm font-semibold text-[#006446] hover:text-[#004d36]"
            >
              Use my current IP
            </button>
          )}

          <button
            type="submit"
            disabled={saving || !ipAddress.trim()}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#006446] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004d36] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add to whitelist
          </button>
        </form>

        <div className="overflow-hidden rounded-[24px] border border-[#006446]/12 bg-white">
          <div className="border-b border-[#006446]/10 px-5 py-4">
            <h3 className="text-lg font-semibold text-slate-950">Allowed addresses</h3>
            <p className="mt-1 text-sm text-slate-500">{entries.length} {entries.length === 1 ? 'address' : 'addresses'} allowed.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#006446]" />
            </div>
          ) : entries.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-slate-900">No IP addresses configured</p>
              <p className="mt-2 text-sm text-slate-500">Add your current address to turn on enforcement.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {entries.map((entry) => {
                const isCurrent = entry.ip_address === currentIp;

                return (
                  <div key={entry.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all font-mono text-sm font-semibold text-slate-900">{entry.ip_address}</p>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {entry.label || 'No label'} · Added {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(entry)}
                      disabled={deletingId === entry.id || (ipCheckEnabled && isCurrent)}
                      title={ipCheckEnabled && isCurrent ? 'Turn off IP checking before removing your current address' : 'Remove IP address'}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {deletingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
