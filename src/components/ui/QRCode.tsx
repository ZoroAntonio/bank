import { useEffect, useRef, useState } from 'react';
import QRCodeGenerator from 'qrcode';

interface QRCodeProps {
  data: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export default function QRCode({
  data,
  size = 200,
  fgColor = '#0f172a',
  bgColor = '#ffffff',
  className = '',
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) {
      setHasError(true);
      return;
    }

    let cancelled = false;
    setHasError(false);

    void QRCodeGenerator.toCanvas(canvas, data, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: size,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    }).catch(() => {
      if (!cancelled) setHasError(true);
    });

    return () => {
      cancelled = true;
    };
  }, [data, size, fgColor, bgColor]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-white text-center text-xs font-medium text-rose-700 ${className}`}
        style={{ width: size, height: size }}
        role="alert"
      >
        QR code unavailable
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Scannable payment QR code"
    />
  );
}
