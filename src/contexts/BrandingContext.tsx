import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

const BRANDING_ROW_ID = 'default';
const BRANDING_CACHE_KEY = 'site-branding:settings';
const BRANDING_REMOTE_DISABLED_KEY = 'site-branding:remote-disabled';
const LEGACY_BRAND_WORD = 'SKOK';
const FALLBACK_LOGO_MAX_WIDTH = 1600;
const FALLBACK_LOGO_MAX_HEIGHT = 600;
const FALLBACK_LOGO_QUALITY = 0.88;
const MAX_FAVICON_SOURCE_BYTES = 10 * 1024 * 1024;
const FAVICON_PNG_SIZES = [16, 32, 48, 180, 192, 512] as const;

export type FaviconSettings = {
  faviconIcoUrl: string;
  favicon16Url: string;
  favicon32Url: string;
  appleTouchIconUrl: string;
  favicon192Url: string;
  favicon512Url: string;
};

export type BrandingSettings = {
  brandName: string;
  brandKeyword: string;
  navbarLogoUrl: string;
  footerLogoUrl: string;
  faviconIcoUrl: string;
  favicon16Url: string;
  favicon32Url: string;
  appleTouchIconUrl: string;
  favicon192Url: string;
  favicon512Url: string;
  mfiId: string;
  countryCode: string;
  mfiCode: string;
  institutionalTitle: string;
  institutionalDescription: string;
  mfiIdNote: string;
  depositorProtectionTitle: string;
  depositorProtectionDescription: string;
  depositorProtectionUrl: string;
  legalContactEmail: string;
  updatedAt: string | null;
};

type BrandingRow = {
  brand_name?: string | null;
  brand_keyword?: string | null;
  navbar_logo_url?: string | null;
  footer_logo_url?: string | null;
  favicon_ico_url?: string | null;
  favicon_16_url?: string | null;
  favicon_32_url?: string | null;
  apple_touch_icon_url?: string | null;
  favicon_192_url?: string | null;
  favicon_512_url?: string | null;
  mfi_id?: string | null;
  country_code?: string | null;
  mfi_code?: string | null;
  institutional_title?: string | null;
  institutional_description?: string | null;
  mfi_id_note?: string | null;
  depositor_protection_title?: string | null;
  depositor_protection_description?: string | null;
  depositor_protection_url?: string | null;
  legal_contact_email?: string | null;
  updated_at?: string | null;
};

export type BrandingUpdate = Pick<
  BrandingSettings,
  | 'brandName'
  | 'brandKeyword'
  | 'navbarLogoUrl'
  | 'footerLogoUrl'
  | 'faviconIcoUrl'
  | 'favicon16Url'
  | 'favicon32Url'
  | 'appleTouchIconUrl'
  | 'favicon192Url'
  | 'favicon512Url'
  | 'mfiId'
  | 'countryCode'
  | 'mfiCode'
  | 'institutionalTitle'
  | 'institutionalDescription'
  | 'mfiIdNote'
  | 'depositorProtectionTitle'
  | 'depositorProtectionDescription'
  | 'depositorProtectionUrl'
  | 'legalContactEmail'
>;

export type BrandingSaveResult = {
  branding: BrandingSettings;
  persisted: 'remote' | 'local';
  error?: string;
};

type LogoSlot = 'navbar' | 'footer';

type BrandingContextType = {
  branding: BrandingSettings;
  loading: boolean;
  remoteAvailable: boolean;
  refreshBranding: () => Promise<void>;
  saveBranding: (updates: BrandingUpdate) => Promise<BrandingSaveResult>;
  uploadLogo: (file: File, slot: LogoSlot) => Promise<string>;
  uploadFavicon: (file: File) => Promise<FaviconSettings>;
  applyBranding: (value: string) => string;
};

export const DEFAULT_BRANDING: BrandingSettings = {
  brandName: 'SKOK Bank',
  brandKeyword: LEGACY_BRAND_WORD,
  navbarLogoUrl: '/skok7.svg',
  footerLogoUrl: '/skok7.svg',
  faviconIcoUrl: '/favicon.ico',
  favicon16Url: '/favicon-16x16.png',
  favicon32Url: '/favicon-32x32.png',
  appleTouchIconUrl: '/apple-touch-icon.png',
  favicon192Url: '/android-chrome-192x192.png',
  favicon512Url: '/android-chrome-512x512.png',
  mfiId: 'PL10026',
  countryCode: 'PL',
  mfiCode: '10026',
  institutionalTitle: '',
  institutionalDescription: '',
  mfiIdNote: '',
  depositorProtectionTitle: '',
  depositorProtectionDescription: '',
  depositorProtectionUrl: 'https://www.gov.pl/web/finance/protection-of-depositors',
  legalContactEmail: 'legal@skok.bank',
  updatedAt: null,
};

const BrandingContext = createContext<BrandingContextType | null>(null);

function cleanText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function cleanOptionalText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanHttpUrl(value: unknown, fallback: string) {
  const candidate = cleanText(value, fallback);

  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? candidate : fallback;
  } catch {
    return fallback;
  }
}

function normalizeBranding(value: Partial<BrandingSettings> | BrandingRow | null | undefined): BrandingSettings {
  return {
    brandName: cleanText('brandName' in (value || {}) ? (value as Partial<BrandingSettings>).brandName : (value as BrandingRow | null | undefined)?.brand_name, DEFAULT_BRANDING.brandName),
    brandKeyword: cleanText('brandKeyword' in (value || {}) ? (value as Partial<BrandingSettings>).brandKeyword : (value as BrandingRow | null | undefined)?.brand_keyword, DEFAULT_BRANDING.brandKeyword),
    navbarLogoUrl: cleanText('navbarLogoUrl' in (value || {}) ? (value as Partial<BrandingSettings>).navbarLogoUrl : (value as BrandingRow | null | undefined)?.navbar_logo_url, DEFAULT_BRANDING.navbarLogoUrl),
    footerLogoUrl: cleanText('footerLogoUrl' in (value || {}) ? (value as Partial<BrandingSettings>).footerLogoUrl : (value as BrandingRow | null | undefined)?.footer_logo_url, DEFAULT_BRANDING.footerLogoUrl),
    faviconIcoUrl: cleanText('faviconIcoUrl' in (value || {}) ? (value as Partial<BrandingSettings>).faviconIcoUrl : (value as BrandingRow | null | undefined)?.favicon_ico_url, DEFAULT_BRANDING.faviconIcoUrl),
    favicon16Url: cleanText('favicon16Url' in (value || {}) ? (value as Partial<BrandingSettings>).favicon16Url : (value as BrandingRow | null | undefined)?.favicon_16_url, DEFAULT_BRANDING.favicon16Url),
    favicon32Url: cleanText('favicon32Url' in (value || {}) ? (value as Partial<BrandingSettings>).favicon32Url : (value as BrandingRow | null | undefined)?.favicon_32_url, DEFAULT_BRANDING.favicon32Url),
    appleTouchIconUrl: cleanText('appleTouchIconUrl' in (value || {}) ? (value as Partial<BrandingSettings>).appleTouchIconUrl : (value as BrandingRow | null | undefined)?.apple_touch_icon_url, DEFAULT_BRANDING.appleTouchIconUrl),
    favicon192Url: cleanText('favicon192Url' in (value || {}) ? (value as Partial<BrandingSettings>).favicon192Url : (value as BrandingRow | null | undefined)?.favicon_192_url, DEFAULT_BRANDING.favicon192Url),
    favicon512Url: cleanText('favicon512Url' in (value || {}) ? (value as Partial<BrandingSettings>).favicon512Url : (value as BrandingRow | null | undefined)?.favicon_512_url, DEFAULT_BRANDING.favicon512Url),
    mfiId: cleanText('mfiId' in (value || {}) ? (value as Partial<BrandingSettings>).mfiId : (value as BrandingRow | null | undefined)?.mfi_id, DEFAULT_BRANDING.mfiId),
    countryCode: cleanText('countryCode' in (value || {}) ? (value as Partial<BrandingSettings>).countryCode : (value as BrandingRow | null | undefined)?.country_code, DEFAULT_BRANDING.countryCode).toUpperCase(),
    mfiCode: cleanText('mfiCode' in (value || {}) ? (value as Partial<BrandingSettings>).mfiCode : (value as BrandingRow | null | undefined)?.mfi_code, DEFAULT_BRANDING.mfiCode),
    institutionalTitle: cleanOptionalText('institutionalTitle' in (value || {}) ? (value as Partial<BrandingSettings>).institutionalTitle : (value as BrandingRow | null | undefined)?.institutional_title),
    institutionalDescription: cleanOptionalText('institutionalDescription' in (value || {}) ? (value as Partial<BrandingSettings>).institutionalDescription : (value as BrandingRow | null | undefined)?.institutional_description),
    mfiIdNote: cleanOptionalText('mfiIdNote' in (value || {}) ? (value as Partial<BrandingSettings>).mfiIdNote : (value as BrandingRow | null | undefined)?.mfi_id_note),
    depositorProtectionTitle: cleanOptionalText('depositorProtectionTitle' in (value || {}) ? (value as Partial<BrandingSettings>).depositorProtectionTitle : (value as BrandingRow | null | undefined)?.depositor_protection_title),
    depositorProtectionDescription: cleanOptionalText('depositorProtectionDescription' in (value || {}) ? (value as Partial<BrandingSettings>).depositorProtectionDescription : (value as BrandingRow | null | undefined)?.depositor_protection_description),
    depositorProtectionUrl: cleanHttpUrl('depositorProtectionUrl' in (value || {}) ? (value as Partial<BrandingSettings>).depositorProtectionUrl : (value as BrandingRow | null | undefined)?.depositor_protection_url, DEFAULT_BRANDING.depositorProtectionUrl),
    legalContactEmail: cleanText('legalContactEmail' in (value || {}) ? (value as Partial<BrandingSettings>).legalContactEmail : (value as BrandingRow | null | undefined)?.legal_contact_email, DEFAULT_BRANDING.legalContactEmail).toLowerCase(),
    updatedAt: cleanText('updatedAt' in (value || {}) ? (value as Partial<BrandingSettings>).updatedAt : (value as BrandingRow | null | undefined)?.updated_at, '') || null,
  };
}

function readCachedBranding() {
  if (typeof window === 'undefined') return DEFAULT_BRANDING;

  try {
    const cached = window.localStorage.getItem(BRANDING_CACHE_KEY);
    if (!cached) return DEFAULT_BRANDING;
    return normalizeBranding(JSON.parse(cached) as Partial<BrandingSettings>);
  } catch {
    return DEFAULT_BRANDING;
  }
}

function cacheBranding(branding: BrandingSettings) {
  try {
    window.localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(branding));
  } catch {
    // Branding still works without local cache; the next load will fetch Supabase again.
  }
}

function isRemoteBrandingDisabled() {
  try {
    return window.localStorage.getItem(BRANDING_REMOTE_DISABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

function setRemoteBrandingDisabled(disabled: boolean) {
  try {
    if (disabled) {
      window.localStorage.setItem(BRANDING_REMOTE_DISABLED_KEY, 'true');
    } else {
      window.localStorage.removeItem(BRANDING_REMOTE_DISABLED_KEY);
    }
  } catch {
    // Local branding still works without this preference.
  }
}

function matchReplacementCase(match: string, replacement: string) {
  if (match === match.toUpperCase()) return replacement.toUpperCase();
  if (match === match.toLowerCase()) return replacement.toLowerCase();
  return replacement;
}

export function applyBrandingToText(value: string, branding: BrandingSettings = DEFAULT_BRANDING) {
  const replacement = branding.brandKeyword.trim() || DEFAULT_BRANDING.brandKeyword;
  if (!value || replacement === LEGACY_BRAND_WORD) return value;

  return value.replace(/\bSKOK\b/gi, (match) => matchReplacementCase(match, replacement));
}

export function getBrandReferencePrefix(branding: BrandingSettings) {
  const clean = (branding.brandKeyword || branding.brandName)
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 12)
    .toUpperCase();

  return clean || DEFAULT_BRANDING.brandKeyword;
}

export function getBrandFileSlug(branding: BrandingSettings) {
  const clean = branding.brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return clean || 'skok-bank';
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function createGeneratedBrandLogo(branding: Pick<BrandingSettings, 'brandName' | 'brandKeyword'>) {
  const keyword = (branding.brandKeyword || branding.brandName || DEFAULT_BRANDING.brandKeyword).trim();
  const text = keyword || DEFAULT_BRANDING.brandKeyword;
  const initials = text
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'B';
  const displayText = text.length > 18 ? text.slice(0, 18) : text;
  const safeInitials = escapeSvgText(initials);
  const safeDisplayText = escapeSvgText(displayText);
  const textWidth = Math.max(170, Math.min(380, displayText.length * 24 + 48));
  const width = textWidth + 88;

  return svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="96" viewBox="0 0 ${width} 96" role="img" aria-label="${safeDisplayText}">
      <rect width="${width}" height="96" fill="transparent"/>
      <g transform="translate(12 14)">
        <rect x="0" y="0" width="68" height="68" rx="18" fill="#006446"/>
        <text x="34" y="43" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" fill="#ffffff">${safeInitials}</text>
      </g>
      <text x="96" y="59" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="800" letter-spacing="1" fill="#006446">${safeDisplayText}</text>
    </svg>
  `);
}

function isDefaultLogoUrl(value: string) {
  const trimmed = value.trim();
  return !trimmed || trimmed === DEFAULT_BRANDING.navbarLogoUrl || trimmed === DEFAULT_BRANDING.footerLogoUrl;
}

function shouldUseGeneratedLogo(branding: Pick<BrandingSettings, 'brandName' | 'brandKeyword'>) {
  return branding.brandName.trim() !== DEFAULT_BRANDING.brandName || branding.brandKeyword.trim() !== DEFAULT_BRANDING.brandKeyword;
}

function toRowPayload(branding: BrandingSettings) {
  return {
    id: BRANDING_ROW_ID,
    brand_name: branding.brandName,
    brand_keyword: branding.brandKeyword,
    navbar_logo_url: branding.navbarLogoUrl,
    footer_logo_url: branding.footerLogoUrl,
    favicon_ico_url: branding.faviconIcoUrl,
    favicon_16_url: branding.favicon16Url,
    favicon_32_url: branding.favicon32Url,
    apple_touch_icon_url: branding.appleTouchIconUrl,
    favicon_192_url: branding.favicon192Url,
    favicon_512_url: branding.favicon512Url,
    mfi_id: branding.mfiId,
    country_code: branding.countryCode,
    mfi_code: branding.mfiCode,
    institutional_title: branding.institutionalTitle,
    institutional_description: branding.institutionalDescription,
    mfi_id_note: branding.mfiIdNote,
    depositor_protection_title: branding.depositorProtectionTitle,
    depositor_protection_description: branding.depositorProtectionDescription,
    depositor_protection_url: branding.depositorProtectionUrl,
    legal_contact_email: branding.legalContactEmail,
    updated_at: new Date().toISOString(),
  };
}

function safeFileName(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return clean || 'logo';
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read the uploaded logo.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read the uploaded logo.'));
    reader.readAsDataURL(file);
  });
}

async function imageFileToOptimizedDataUrl(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not prepare the uploaded logo.'));
      img.src = objectUrl;
    });

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      return fileToDataUrl(file);
    }

    const scale = Math.min(
      1,
      FALLBACK_LOGO_MAX_WIDTH / sourceWidth,
      FALLBACK_LOGO_MAX_HEIGHT / sourceHeight
    );
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return fileToDataUrl(file);
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL('image/webp', FALLBACK_LOGO_QUALITY);
  } catch {
    return fileToDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not generate a favicon image.'));
      }
    }, 'image/png');
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Could not prepare the generated favicon.'));
    reader.onerror = () => reject(new Error('Could not prepare the generated favicon.'));
    reader.readAsDataURL(blob);
  });
}

async function createIcoBlob(pngBlobs: Array<{ size: number; blob: Blob }>) {
  const pngBuffers = await Promise.all(pngBlobs.map(({ blob }) => blob.arrayBuffer()));
  const directorySize = 6 + (16 * pngBlobs.length);
  const directory = new ArrayBuffer(directorySize);
  const view = new DataView(directory);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, pngBlobs.length, true);

  let imageOffset = directorySize;
  pngBlobs.forEach(({ size }, index) => {
    const entryOffset = 6 + (index * 16);
    const buffer = pngBuffers[index];
    view.setUint8(entryOffset, size >= 256 ? 0 : size);
    view.setUint8(entryOffset + 1, size >= 256 ? 0 : size);
    view.setUint8(entryOffset + 2, 0);
    view.setUint8(entryOffset + 3, 0);
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, buffer.byteLength, true);
    view.setUint32(entryOffset + 12, imageOffset, true);
    imageOffset += buffer.byteLength;
  });

  return new Blob([directory, ...pngBuffers], { type: 'image/x-icon' });
}

async function generateFaviconFiles(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read the favicon source image.'));
      img.src = objectUrl;
    });
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      throw new Error('The favicon source image has invalid dimensions.');
    }

    const pngEntries = await Promise.all(FAVICON_PNG_SIZES.map(async (size) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('This browser cannot generate favicon images.');
      }

      const padding = Math.round(size * 0.06);
      const availableSize = size - (padding * 2);
      const scale = Math.min(availableSize / sourceWidth, availableSize / sourceHeight);
      const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
      const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
      const x = Math.round((size - drawWidth) / 2);
      const y = Math.round((size - drawHeight) / 2);

      context.clearRect(0, 0, size, size);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, x, y, drawWidth, drawHeight);

      return { size, blob: await canvasToPngBlob(canvas) };
    }));
    const pngBySize = new Map(pngEntries.map((entry) => [entry.size, entry.blob]));
    const icoBlob = await createIcoBlob(
      pngEntries.filter(({ size }) => size === 16 || size === 32 || size === 48),
    );

    return { icoBlob, pngBySize };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function requireGeneratedPng(pngBySize: Map<number, Blob>, size: number) {
  const blob = pngBySize.get(size);
  if (!blob) throw new Error(`Could not generate the ${size}x${size} favicon.`);
  return blob;
}

function resolveBrowserAssetUrl(value: string) {
  const src = value.trim();
  if (/^(data:|blob:|https?:\/\/|\/\/)/i.test(src)) return src;
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
}

function updateHeadLink(rel: string, sizes: string, href: string, type?: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][sizes="${sizes}"]`);

  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    link.sizes = sizes;
    document.head.appendChild(link);
  }

  link.href = resolveBrowserAssetUrl(href);
  if (type) link.type = type;
}

function BrandingBootstrapScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9f8]" aria-busy="true" aria-label="Loading site settings">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#006446]" />
    </div>
  );
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(() => readCachedBranding());
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [remoteAvailable, setRemoteAvailable] = useState(() => !isRemoteBrandingDisabled());

  const refreshBranding = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('site_branding')
        .select('brand_name, brand_keyword, navbar_logo_url, footer_logo_url, favicon_ico_url, favicon_16_url, favicon_32_url, apple_touch_icon_url, favicon_192_url, favicon_512_url, mfi_id, country_code, mfi_code, institutional_title, institutional_description, mfi_id_note, depositor_protection_title, depositor_protection_description, depositor_protection_url, legal_contact_email, updated_at')
        .eq('id', BRANDING_ROW_ID)
        .maybeSingle();

      if (!error && data) {
        setRemoteBrandingDisabled(false);
        setRemoteAvailable(true);
        const nextBranding = normalizeBranding(data as BrandingRow);
        setBranding(nextBranding);
        cacheBranding(nextBranding);
      } else if (!error) {
        setRemoteBrandingDisabled(false);
        setRemoteAvailable(true);
      } else {
        setRemoteBrandingDisabled(true);
        setRemoteAvailable(false);
        console.warn('Could not load site branding settings:', error.message);
      }
    } catch (error) {
      setRemoteBrandingDisabled(true);
      setRemoteAvailable(false);
      console.warn('Could not load site branding settings:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  const saveBranding = useCallback(async (updates: BrandingUpdate): Promise<BrandingSaveResult> => {
    const baseBranding = normalizeBranding({ ...branding, ...updates });
    const generatedLogo = shouldUseGeneratedLogo(baseBranding) ? createGeneratedBrandLogo(baseBranding) : '';
    const nextBranding = {
      ...baseBranding,
      navbarLogoUrl: generatedLogo && isDefaultLogoUrl(baseBranding.navbarLogoUrl) ? generatedLogo : baseBranding.navbarLogoUrl,
      footerLogoUrl: generatedLogo && isDefaultLogoUrl(baseBranding.footerLogoUrl) ? generatedLogo : baseBranding.footerLogoUrl,
    };
    const localSavedBranding = {
      ...nextBranding,
      updatedAt: new Date().toISOString(),
    };

    setBranding(localSavedBranding);
    cacheBranding(localSavedBranding);

    const { data, error } = await supabase
      .from('site_branding')
      .upsert(toRowPayload(nextBranding), { onConflict: 'id' })
      .select('brand_name, brand_keyword, navbar_logo_url, footer_logo_url, favicon_ico_url, favicon_16_url, favicon_32_url, apple_touch_icon_url, favicon_192_url, favicon_512_url, mfi_id, country_code, mfi_code, institutional_title, institutional_description, mfi_id_note, depositor_protection_title, depositor_protection_description, depositor_protection_url, legal_contact_email, updated_at')
      .single();

    if (error) {
      setRemoteBrandingDisabled(true);
      setRemoteAvailable(false);
      console.warn('Could not save branding settings to Supabase; using local saved settings:', error.message);
      return {
        branding: localSavedBranding,
        persisted: 'local',
        error: error.message,
      };
    }

    setRemoteBrandingDisabled(false);
    setRemoteAvailable(true);
    const savedBranding = normalizeBranding(data as BrandingRow);
    setBranding(savedBranding);
    cacheBranding(savedBranding);
    return {
      branding: savedBranding,
      persisted: 'remote',
    };
  }, [branding]);

  const uploadLogo = useCallback(async (file: File, slot: LogoSlot) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file.');
    }

    const path = `logos/${slot}-${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from('site-branding').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      setRemoteBrandingDisabled(true);
      setRemoteAvailable(false);
      console.warn('Could not upload logo to Supabase Storage; embedding an optimized logo in branding settings:', error.message);
      return imageFileToOptimizedDataUrl(file);
    }

    setRemoteBrandingDisabled(false);
    setRemoteAvailable(true);
    const { data } = supabase.storage.from('site-branding').getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const uploadFavicon = useCallback(async (file: File): Promise<FaviconSettings> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file for the favicon.');
    }

    if (file.size > MAX_FAVICON_SOURCE_BYTES) {
      throw new Error('The favicon source image must be 10 MB or smaller.');
    }

    const { icoBlob, pngBySize } = await generateFaviconFiles(file);
    const generatedFiles = [
      { key: 'faviconIcoUrl', path: 'favicon.ico', blob: icoBlob, contentType: 'image/x-icon' },
      { key: 'favicon16Url', path: 'favicon-16x16.png', blob: requireGeneratedPng(pngBySize, 16), contentType: 'image/png' },
      { key: 'favicon32Url', path: 'favicon-32x32.png', blob: requireGeneratedPng(pngBySize, 32), contentType: 'image/png' },
      { key: 'appleTouchIconUrl', path: 'apple-touch-icon-180x180.png', blob: requireGeneratedPng(pngBySize, 180), contentType: 'image/png' },
      { key: 'favicon192Url', path: 'android-chrome-192x192.png', blob: requireGeneratedPng(pngBySize, 192), contentType: 'image/png' },
      { key: 'favicon512Url', path: 'android-chrome-512x512.png', blob: requireGeneratedPng(pngBySize, 512), contentType: 'image/png' },
    ] as const;
    const directory = `favicons/${Date.now()}`;
    const uploadResults = await Promise.all(generatedFiles.map(async (asset) => {
      const path = `${directory}/${asset.path}`;
      const result = await supabase.storage.from('site-branding').upload(path, asset.blob, {
        cacheControl: '31536000',
        contentType: asset.contentType,
        upsert: false,
      });
      return { ...asset, path, error: result.error };
    }));
    const failedUpload = uploadResults.find(({ error }) => error);

    if (failedUpload) {
      setRemoteBrandingDisabled(true);
      setRemoteAvailable(false);
      console.warn('Could not upload generated favicons to Supabase Storage; embedding them in local branding settings:', failedUpload.error?.message);
      const fallbackEntries = await Promise.all(generatedFiles.map(async ({ key, blob }) => (
        [key, await blobToDataUrl(blob)] as const
      )));
      return Object.fromEntries(fallbackEntries) as FaviconSettings;
    }

    setRemoteBrandingDisabled(false);
    setRemoteAvailable(true);
    const publicEntries = uploadResults.map(({ key, path }) => {
      const { data } = supabase.storage.from('site-branding').getPublicUrl(path);
      return [key, data.publicUrl] as const;
    });
    return Object.fromEntries(publicEntries) as FaviconSettings;
  }, []);

  const applyBranding = useCallback((value: string) => applyBrandingToText(value, branding), [branding]);

  useEffect(() => {
    void refreshBranding();
  }, [refreshBranding]);

  useLayoutEffect(() => {
    if (!initialized) return undefined;

    document.title = branding.brandName;
    document.head.querySelector<HTMLMetaElement>('meta[name="application-name"]')?.setAttribute('content', branding.brandName);
    document.head.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', branding.brandName);
    updateHeadLink('icon', 'any', branding.faviconIcoUrl, 'image/x-icon');
    updateHeadLink('icon', '16x16', branding.favicon16Url, 'image/png');
    updateHeadLink('icon', '32x32', branding.favicon32Url, 'image/png');
    updateHeadLink('icon', '192x192', branding.favicon192Url, 'image/png');
    updateHeadLink('apple-touch-icon', '180x180', branding.appleTouchIconUrl, 'image/png');

    const manifest = {
      name: branding.brandName,
      short_name: branding.brandName,
      icons: [
        { src: resolveBrowserAssetUrl(branding.favicon192Url), sizes: '192x192', type: 'image/png' },
        { src: resolveBrowserAssetUrl(branding.favicon512Url), sizes: '512x512', type: 'image/png' },
      ],
      start_url: '/',
      scope: '/',
      theme_color: '#006446',
      background_color: '#ffffff',
      display: 'standalone',
    };
    const manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
    const manifestLink = document.head.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifestLink) manifestLink.href = manifestUrl;

    return () => URL.revokeObjectURL(manifestUrl);
  }, [branding, initialized]);

  const value = useMemo<BrandingContextType>(() => ({
    branding,
    loading,
    remoteAvailable,
    refreshBranding,
    saveBranding,
    uploadLogo,
    uploadFavicon,
    applyBranding,
  }), [applyBranding, branding, loading, refreshBranding, remoteAvailable, saveBranding, uploadFavicon, uploadLogo]);

  return (
    <BrandingContext.Provider value={value}>
      {initialized ? children : <BrandingBootstrapScreen />}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}

export function useOptionalBranding() {
  return useContext(BrandingContext);
}
