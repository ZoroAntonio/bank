import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  Banknote,
  ChevronDown,
  CreditCard,
  FileText,
  Globe,
  Landmark,
  LayoutDashboard,
  LogOut,
  PieChart,
  Receipt,
  Send,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { languages, useLanguage } from '../../contexts/LanguageContext';
import '../../i18n/dashboard-layout/translations';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { branding } = useBranding();
  const { t, language, setLanguage } = useLanguage();
  const isCrmAdmin = location.pathname.startsWith('/crm-admin');

  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    setShowLangDropdown(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navSections = [
    {
      label: t('dashboardLayout.sections.banking'),
      items: [
        { path: '/dashboard', label: t('dashboardLayout.nav.overview'), icon: LayoutDashboard },
        { path: '/dashboard/cards', label: t('dashboardLayout.nav.cards'), icon: CreditCard },
        { path: '/dashboard/transactions', label: t('dashboardLayout.nav.transactions'), icon: Receipt },
        { path: '/dashboard/transfers', label: t('dashboardLayout.nav.transfers'), icon: Send },
        { path: '/dashboard/taxes', label: t('dashboardLayout.nav.taxes'), icon: FileText },
        { path: '/dashboard/bill-pay', label: t('dashboardLayout.nav.billPay'), icon: Zap },
      ],
    },
    {
      label: t('dashboardLayout.sections.wealth'),
      items: [
        { path: '/dashboard/fixed-deposits', label: t('dashboardLayout.nav.addFund'), icon: Landmark },
        { path: '/dashboard/loans', label: t('dashboardLayout.nav.loans'), icon: Banknote },
        { path: '/dashboard/currency-exchange', label: t('dashboardLayout.nav.fx'), icon: ArrowRightLeft },
        { path: '/dashboard/analytics', label: t('dashboardLayout.nav.analytics'), icon: PieChart },
      ],
    },
  ];

  const currentLang = languages.find((item) => item.code === language)!;
  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 flex min-h-0 overflow-hidden bg-[#006446]/[0.04]">
      {!isCrmAdmin && (
          <aside
            className="relative z-20 flex w-[264px] shrink-0 flex-col overflow-hidden text-white shadow-[18px_0_45px_-38px_rgba(0,100,70,0.7)]"
            style={{ background: 'linear-gradient(180deg, #004c36 0%, #006446 52%, #07553f 100%)' }}
          >
            <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-5">
              <Link to="/dashboard" className="flex min-w-0 items-center gap-3 rounded-lg py-2 text-white">
                <Landmark className="h-7 w-7 shrink-0" />
                <span className="truncate text-xl font-bold tracking-wide">
                  {branding.brandKeyword || branding.brandName}
                </span>
              </Link>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 scrollbar-hide">
              {navSections.map((section) => (
                <div key={section.label} className="mb-6 last:mb-0">
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                    {section.label}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={item.label}
                          aria-current={active ? 'page' : undefined}
                          style={active ? { color: '#005b40' } : undefined}
                          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-white shadow-[0_10px_25px_-18px_rgba(0,0,0,0.8)]'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              active ? 'bg-[#006446]/10' : 'bg-white/[0.07] group-hover:bg-white/10'
                            }`}
                          >
                            <item.icon className="h-[18px] w-[18px]" />
                          </span>
                          <span className="truncate">{item.label}</span>
                          {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#008b62]" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="mt-1 border-t border-white/10 pt-4">
                <Link
                  to="/dashboard/profile"
                  title={t('dashboardLayout.nav.profile')}
                  aria-current={isActive('/dashboard/profile') ? 'page' : undefined}
                  style={isActive('/dashboard/profile') ? { color: '#005b40' } : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive('/dashboard/profile')
                      ? 'bg-white shadow-[0_10px_25px_-18px_rgba(0,0,0,0.8)]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isActive('/dashboard/profile') ? 'bg-[#006446]/10' : 'bg-white/[0.07] group-hover:bg-white/10'
                    }`}
                  >
                    <User className="h-[18px] w-[18px]" />
                  </span>
                  <span>{t('dashboardLayout.nav.profile')}</span>
                </Link>
              </div>
            </nav>

            <div className="shrink-0 border-t border-white/10 px-3 py-3">
              <div ref={langRef} className="relative mb-1">
                <button
                  type="button"
                  onClick={() => setShowLangDropdown((open) => !open)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                  title={t('dashboardLayout.header.language')}
                  aria-expanded={showLangDropdown}
                >
                  <Globe className="h-[18px] w-[18px]" />
                  <img src={currentLang.flag} alt="" className="h-4 w-6 rounded-sm object-cover" />
                  <span className="font-medium">{currentLang.label}</span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {showLangDropdown && (
                  <div className="absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xl">
                    {languages.map((lang) => (
                      <button
                        type="button"
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangDropdown(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                          language === lang.code
                            ? 'bg-[#006446]/10 font-semibold text-[#006446]'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        <img src={lang.flag} alt="" className="h-4 w-6 rounded-sm border border-slate-200 object-cover" />
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-red-400/15 hover:text-white"
                title={t('dashboardLayout.header.signOut')}
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span>{t('dashboardLayout.header.signOut')}</span>
              </button>
            </div>
          </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
