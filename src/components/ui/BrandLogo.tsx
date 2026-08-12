import { useMemo, useState } from 'react';
import { DEFAULT_BRANDING } from '../../contexts/BrandingContext';

type BrandLogoProps = {
  src: string;
  alt: string;
  className?: string;
};

function getPublicAssetUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function normalizeLogoSrc(value: string) {
  const src = value.trim();

  if (!src) return getPublicAssetUrl(DEFAULT_BRANDING.navbarLogoUrl);
  if (/^(data:|blob:|https?:\/\/|\/\/)/i.test(src)) return src;

  return getPublicAssetUrl(src);
}

export default function BrandLogo({ src, alt, className }: BrandLogoProps) {
  const preferredSrc = useMemo(() => normalizeLogoSrc(src), [src]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === preferredSrc) {
    return <span className={className}>{alt}</span>;
  }

  return (
    <img
      src={preferredSrc}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(preferredSrc)}
    />
  );
}
