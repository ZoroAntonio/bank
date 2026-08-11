import type { FiatBalance } from '../../hooks/useFiatBalances';
import type { CryptoBalance } from '../../hooks/useCryptoBalances';
import { getBalanceStatusClasses, isBalanceAvailable } from '../../lib/balanceStatus';
import {
  getLocalizedBalanceCardTitle,
  getLocalizedBalanceStatusLabel,
} from '../../lib/balanceStatusI18n';

type Translate = (key: string) => string;

function formatFiat(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

function formatCrypto(amount: number, symbol: string) {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })} ${symbol}`;
}

export default function RestrictedBalanceReference({
  t,
  fiatBalances,
  cryptoBalances,
}: {
  t: Translate;
  fiatBalances: FiatBalance[];
  cryptoBalances: CryptoBalance[];
}) {
  const balances = [
    ...fiatBalances
      .filter((balance) => !isBalanceAvailable(balance.status))
      .map((balance) => ({
        id: `fiat-${balance.id}`,
        code: balance.currency,
        name: balance.name || balance.currency,
        status: balance.status,
        amount: formatFiat(Number(balance.balance), balance.currency),
      })),
    ...cryptoBalances
      .filter((balance) => !isBalanceAvailable(balance.status))
      .map((balance) => ({
        id: `crypto-${balance.id}`,
        code: balance.symbol,
        name: balance.name || balance.symbol,
        status: balance.status,
        amount: formatCrypto(Number(balance.balance), balance.symbol),
      })),
  ];

  if (balances.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.3)]">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Pending and frozen balances</h2>
        <p className="mt-1 text-xs text-slate-500">Visible for reference and excluded from actions until marked available.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {balances.map((balance) => (
          <div key={balance.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-800">{balance.code}</p>
                <p className="truncate text-[11px] text-slate-500">{balance.name}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${getBalanceStatusClasses(balance.status)}`}>
                {getLocalizedBalanceStatusLabel(t, balance.status)}
              </span>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {getLocalizedBalanceCardTitle(t, balance.status)}
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-slate-900">{balance.amount}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
