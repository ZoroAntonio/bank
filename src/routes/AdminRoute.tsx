import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, LockKeyhole, LogOut, RefreshCw } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/ui/LoadingScreen';
import DashboardLayout from '../components/layout/DashboardLayout';
import { checkCrmIpAccess, type CrmIpAccessStatus } from '../lib/crmIpAccess';

type IpGateState =
  | { kind: 'checking' }
  | { kind: 'allowed'; status: CrmIpAccessStatus }
  | { kind: 'denied'; status: CrmIpAccessStatus }
  | { kind: 'error'; message: string };

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, loading, isCrmStaff, signOut } = useAuth();
  const [ipGate, setIpGate] = useState<IpGateState>({ kind: 'checking' });

  const verifyIpAccess = useCallback(async (showLoading = true) => {
    if (!user || !isCrmStaff) return;

    if (showLoading) setIpGate({ kind: 'checking' });
    try {
      const status = await checkCrmIpAccess();
      setIpGate({ kind: status.allowed ? 'allowed' : 'denied', status });
    } catch (error) {
      setIpGate({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not verify this IP address.',
      });
    }
  }, [isCrmStaff, user]);

  useEffect(() => {
    void verifyIpAccess();

    const verifyInBackground = () => void verifyIpAccess(false);
    const intervalId = window.setInterval(verifyInBackground, 5 * 60 * 1000);
    window.addEventListener('focus', verifyInBackground);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', verifyInBackground);
    };
  }, [verifyIpAccess]);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/online-banking" replace />;
  if (!isCrmStaff) return <Navigate to="/dashboard" replace />;

  if (ipGate.kind === 'checking') return <LoadingScreen />;

  if (ipGate.kind === 'denied' || ipGate.kind === 'error') {
    const denied = ipGate.kind === 'denied';

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f8f5] px-5 py-12">
        <section className="w-full max-w-xl rounded-[32px] border border-red-200 bg-white p-8 text-center shadow-[0_30px_80px_-55px_rgba(127,29,29,0.45)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            {denied ? <LockKeyhole className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-red-600">CRM access blocked</p>
          <h1 className="mt-2 text-3xl font-serif font-bold text-slate-950">
            {denied ? 'This IP address is not allowed' : 'IP access could not be verified'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {denied
              ? 'Ask a CRM administrator to add this address to the IP whitelist from an already approved network.'
              : ipGate.message}
          </p>
          {denied && ipGate.status.current_ip && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800">
              {ipGate.status.current_ip}
            </div>
          )}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void verifyIpAccess()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#006446] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#004d36]"
            >
              <RefreshCw className="h-4 w-4" />
              Check again
            </button>
            <button
              type="button"
              onClick={() => void signOut().then(() => navigate('/online-banking'))}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
