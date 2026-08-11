import { AlertTriangle, QrCode } from 'lucide-react';
import { CryptoPaymentWallet, getCryptoPaymentRequest } from '../../lib/cryptoPayment';
import QRCode from './QRCode';

interface CryptoWalletQRCodeProps {
  wallet: CryptoPaymentWallet;
  size?: number;
  className?: string;
  showFormat?: boolean;
}

export default function CryptoWalletQRCode({
  wallet,
  size = 180,
  className = '',
  showFormat = true,
}: CryptoWalletQRCodeProps) {
  const request = getCryptoPaymentRequest(wallet);

  if (!request.valid) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-rose-50 p-4 text-center text-rose-800 ${className}`}
        style={{ width: size, minHeight: size }}
        role="alert"
      >
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        <span className="text-xs font-semibold">QR unavailable</span>
        <span className="text-[10px] leading-relaxed">{request.error}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <QRCode data={request.payload} size={size} />
      {showFormat ? (
        <div className="mt-2 flex max-w-full items-center gap-1.5 text-center text-[10px] font-medium text-[#006446]/75">
          <QrCode className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          <span>{request.format}</span>
        </div>
      ) : null}
    </div>
  );
}
