import { AlertTriangle, QrCode } from 'lucide-react';
import { CryptoPaymentWallet, getCryptoPaymentRequest } from '../../lib/cryptoPayment';
import QRCode from './QRCode';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../i18n/qr-code/translations';

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
  const { t } = useLanguage();
  const request = getCryptoPaymentRequest(wallet);

  const getErrorMessage = () => {
    if (request.error === 'No wallet address is configured.') {
      return t('qrCode.noWalletAddress');
    }
    if (request.error === 'The custom payment URI must be a valid URI containing this wallet address.') {
      return t('qrCode.invalidPaymentUri');
    }
    const invalidAddress = request.error?.match(/^This is not a valid (.+) wallet address\.$/);
    if (invalidAddress) {
      return t('qrCode.invalidWalletAddress').replace('{network}', invalidAddress[1]);
    }
    return request.error;
  };

  const getFormatLabel = () => {
    if (request.format === 'Wallet address') return t('qrCode.format.walletAddress');
    if (request.format === 'Wallet address (token network)') return t('qrCode.format.tokenNetwork');
    if (request.format === 'Custom wallet payment URI') return t('qrCode.format.customUri');
    if (request.format === 'Bitcoin payment URI') return t('qrCode.format.bitcoinUri');
    if (request.format === 'EIP-681 payment URI') return t('qrCode.format.eip681Uri');
    const eip681Chain = request.format.match(/^EIP-681 payment URI \(chain (.+)\)$/);
    if (eip681Chain) return t('qrCode.format.eip681ChainUri').replace('{chain}', eip681Chain[1]);
    if (request.format === 'Solana Pay transfer URI') return t('qrCode.format.solanaUri');
    if (request.format === 'Dogecoin payment URI') return t('qrCode.format.dogecoinUri');
    if (request.format === 'Litecoin payment URI') return t('qrCode.format.litecoinUri');
    if (request.format === 'Bitcoin Cash payment URI') return t('qrCode.format.bitcoinCashUri');
    return request.format;
  };

  if (!request.valid) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-rose-50 p-4 text-center text-rose-800 ${className}`}
        style={{ width: size, minHeight: size }}
        role="alert"
      >
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        <span className="text-xs font-semibold">{t('qrCode.paymentUnavailable')}</span>
        <span className="text-[10px] leading-relaxed">{getErrorMessage()}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <QRCode data={request.payload} size={size} />
      {showFormat ? (
        <div className="mt-2 flex max-w-full items-center gap-1.5 text-center text-[10px] font-medium text-[#006446]/75">
          <QrCode className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          <span>{getFormatLabel()}</span>
        </div>
      ) : null}
    </div>
  );
}
