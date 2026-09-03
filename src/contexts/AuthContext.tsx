import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isStaffCrmRole, normalizeCrmRole, type CrmRole } from '../lib/crmRoles';

type KycStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type PinVerificationCode = 'verified' | 'invalid' | 'locked' | 'not_set' | 'session_missing';

interface AuthProfile {
  full_name: string;
  email: string;
  account_iban: string;
  kyc_status: KycStatus;
  crm_role: CrmRole;
  is_admin: boolean;
  assigned_manager_id: string | null;
  assigned_agent_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  kycStatus: KycStatus | null;
  isAdmin: boolean;
  isCrmStaff: boolean;
  crmRole: CrmRole;
  profile: AuthProfile | null;
  pinVerified: boolean;
  refreshKycStatus: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, loginPin: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  verifyPin: (pin: string) => Promise<{ code: PinVerificationCode; error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PIN_VERIFICATION_STORAGE_KEY = 'skok-pin-verified-session';

interface PinVerificationMarker {
  userId: string;
  sessionId: string;
}

function getAuthSessionId(session: Session): string | null {
  try {
    const payload = session.access_token.split('.')[1];
    if (!payload) return null;

    const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalizedPayload = base64Payload.padEnd(
      base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
      '=',
    );
    const decodedPayload = JSON.parse(window.atob(normalizedPayload)) as { session_id?: unknown };
    return typeof decodedPayload.session_id === 'string' ? decodedPayload.session_id : null;
  } catch {
    return null;
  }
}

function hasVerifiedPinForSession(session: Session): boolean {
  const sessionId = getAuthSessionId(session);
  if (!sessionId) return false;

  try {
    const storedMarker = window.sessionStorage.getItem(PIN_VERIFICATION_STORAGE_KEY);
    if (!storedMarker) return false;

    const marker = JSON.parse(storedMarker) as Partial<PinVerificationMarker>;
    return marker.userId === session.user.id && marker.sessionId === sessionId;
  } catch {
    return false;
  }
}

function rememberVerifiedPin(session: Session) {
  const sessionId = getAuthSessionId(session);
  if (!sessionId) return;

  const marker: PinVerificationMarker = {
    userId: session.user.id,
    sessionId,
  };
  window.sessionStorage.setItem(PIN_VERIFICATION_STORAGE_KEY, JSON.stringify(marker));
}

function forgetVerifiedPin() {
  window.sessionStorage.removeItem(PIN_VERIFICATION_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCrmStaff, setIsCrmStaff] = useState(false);
  const [crmRole, setCrmRole] = useState<CrmRole>('customer');
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [pinVerified, setPinVerified] = useState(false);
  const userRef = useRef<User | null>(null);
  const profileRef = useRef<AuthProfile | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfileState = useCallback(async (userId: string, pinVerifiedInTab = false) => {
    const [{ data }, { data: currentPinVerification, error: pinVerificationError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, email, account_iban, kyc_status, crm_role, is_admin, assigned_manager_id, assigned_agent_id')
        .eq('id', userId)
        .maybeSingle(),
      supabase.rpc('is_login_pin_verified'),
    ]);

    if (data) {
      // Keep the legacy is_admin flag authoritative for administrators. Some
      // existing rows were promoted by setting this flag without also updating
      // the newer crm_role column.
      const nextRole = data.is_admin
        ? 'admin'
        : normalizeCrmRole(data.crm_role, 'customer');
      const nextProfile = {
        full_name: data.full_name || '',
        email: data.email || '',
        account_iban: data.account_iban || '',
        kyc_status: data.kyc_status as KycStatus,
        crm_role: nextRole,
        is_admin: nextRole === 'admin',
        assigned_manager_id: data.assigned_manager_id || null,
        assigned_agent_id: data.assigned_agent_id || null,
      };
      profileRef.current = nextProfile;
      setProfile(nextProfile);
      setKycStatus(data.kyc_status as KycStatus);
      setCrmRole(nextRole);
      setIsAdmin(nextRole === 'admin');
      setIsCrmStaff(isStaffCrmRole(nextRole));
      // Existing CRM staff must remain able to deploy/manage the new PIN flow
      // if the RPC is temporarily unavailable. Once deployed, the RPC requires
      // the second step for every profile that has a PIN assigned.
      setPinVerified(
        pinVerifiedInTab ||
        currentPinVerification === true ||
        (isStaffCrmRole(nextRole) && Boolean(pinVerificationError)),
      );
    } else {
      profileRef.current = null;
      setProfile(null);
      setKycStatus(null);
      setIsAdmin(false);
      setIsCrmStaff(false);
      setCrmRole('customer');
      setPinVerified(false);
    }
  }, []);

  const refreshKycStatus = useCallback(async () => {
    if (user && session) {
      await fetchProfileState(user.id, hasVerifiedPinForSession(session));
    }
  }, [user, session, fetchProfileState]);

  useEffect(() => {
    let active = true;
    let authEventVersion = 0;

    const clearAuthState = () => {
      if (!active) return;

      setSession(null);
      setUser(null);
      userRef.current = null;
      profileRef.current = null;
      setProfile(null);
      setKycStatus(null);
      setIsAdmin(false);
      setIsCrmStaff(false);
      setCrmRole('customer');
      setPinVerified(false);
      forgetVerifiedPin();
      setLoading(false);
    };

    const applySession = (
      nextSession: Session,
      options: { refreshProfile?: boolean; replaceUser?: boolean } = {},
    ) => {
      if (!active) return;

      setSession(nextSession);

      const existingUser = userRef.current;
      const existingProfile = profileRef.current;
      const sameUser = existingUser?.id === nextSession.user.id;
      const shouldBlockForProfile =
        !sameUser || !existingProfile;

      // TOKEN_REFRESHED and repeated SIGNED_IN events are normal when returning
      // to a browser tab. Preserve the existing User object so route guards and
      // data screens do not interpret token maintenance as a new login.
      if (!sameUser || options.replaceUser) {
        setUser(nextSession.user);
        userRef.current = nextSession.user;
      }

      if (shouldBlockForProfile) {
        setLoading(true);
      }

      if (shouldBlockForProfile || options.refreshProfile) {
        void fetchProfileState(
          nextSession.user.id,
          hasVerifiedPinForSession(nextSession),
        ).finally(() => {
          if (active) setLoading(false);
        });
      }
    };

    const initialAuthVersion = authEventVersion;
    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!active || initialAuthVersion !== authEventVersion) return;

      if (initialSession) {
        applySession(initialSession);
      } else {
        clearAuthState();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const eventVersion = ++authEventVersion;

      if (nextSession) {
        applySession(nextSession, {
          refreshProfile: event === 'USER_UPDATED',
          replaceUser: event === 'USER_UPDATED',
        });
        return;
      }

      if (event === 'SIGNED_OUT') {
        // A remote admin operation can briefly emit a null auth event even though the
        // current browser session is still stored and valid. Verify it before allowing
        // route guards to send the CRM administrator back to the login page.
        window.setTimeout(() => {
          void supabase.auth.getSession().then(({ data: { session: persistedSession } }) => {
            if (!active || eventVersion !== authEventVersion) return;

            if (persistedSession) {
              applySession(persistedSession);
            } else {
              clearAuthState();
            }
          });
        }, 100);
        return;
      }

      clearAuthState();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileState]);

  const signUp = async (email: string, password: string, fullName: string, loginPin: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.functions.invoke('public-register', {
      body: {
        email: normalizedEmail,
        password,
        full_name: fullName.trim(),
        login_pin: loginPin,
      },
    });

    if (error) return { error: data?.error || error.message };
    if (data?.error) return { error: data.error };

    return signIn(normalizedEmail, password);
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    forgetVerifiedPin();
    setPinVerified(false);
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  const verifyPin = async (pin: string) => {
    const { data, error } = await supabase.rpc('verify_login_pin', { p_pin: pin });

    if (error) {
      return { code: 'session_missing' as PinVerificationCode, error: error.message };
    }

    const code = (
      ['verified', 'invalid', 'locked', 'not_set', 'session_missing'].includes(String(data))
        ? String(data)
        : 'invalid'
    ) as PinVerificationCode;

    if (code === 'verified') {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) rememberVerifiedPin(currentSession);
      setPinVerified(true);
    }
    return { code, error: null };
  };

  const signOut = async () => {
    forgetVerifiedPin();
    setPinVerified(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, kycStatus, isAdmin, isCrmStaff, crmRole, profile, pinVerified, refreshKycStatus, signUp, signIn, verifyPin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
