const PUBLIC_TRANSFER_ID_LENGTH = 8;

export function formatPublicTransferId(value: string) {
  const normalized = value
    .replace(/^trx-/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, PUBLIC_TRANSFER_ID_LENGTH);

  return normalized ? `TRX-${normalized}` : '';
}

export function createTransferVerificationUrl(origin: string, transferId: string) {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const publicTransferId = formatPublicTransferId(transferId);
  return `${cleanOrigin}/transfer/${encodeURIComponent(publicTransferId)}`;
}
