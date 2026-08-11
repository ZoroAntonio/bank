import { base58, bech32, bech32m, createBase58check } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2.js';

export interface CryptoPaymentWallet {
  wallet_address: string;
  symbol?: string | null;
  network?: string | null;
  payment_uri?: string | null;
}

export interface CryptoPaymentRequest {
  address: string;
  payload: string;
  valid: boolean;
  format: string;
  error: string | null;
  usesCustomUri: boolean;
}

type NetworkFamily =
  | 'bitcoin'
  | 'ethereum'
  | 'solana'
  | 'dogecoin'
  | 'litecoin'
  | 'bitcoin-cash'
  | 'tron'
  | 'unknown';

const base58check = createBase58check(sha256);

const EVM_CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  ethereummainnet: 1,
  polygon: 137,
  polygonpos: 137,
  bnbsmartchain: 56,
  binancesmartchain: 56,
  bsc: 56,
  arbitrum: 42161,
  arbitrumone: 42161,
  optimism: 10,
  avalanche: 43114,
  avalanchecchain: 43114,
  base: 8453,
};

const EVM_NATIVE_SYMBOLS: Record<string, string[]> = {
  ethereum: ['ETH'],
  ethereummainnet: ['ETH'],
  polygon: ['MATIC', 'POL'],
  polygonpos: ['MATIC', 'POL'],
  bnbsmartchain: ['BNB'],
  binancesmartchain: ['BNB'],
  bsc: ['BNB'],
  arbitrum: ['ETH'],
  arbitrumone: ['ETH'],
  optimism: ['ETH'],
  avalanche: ['AVAX'],
  avalanchecchain: ['AVAX'],
  base: ['ETH'],
};

function compact(value?: string | null) {
  return (value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function hasControlCharacters(value: string) {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

function resolveNetworkFamily(symbol?: string | null, network?: string | null): NetworkFamily {
  const normalizedNetwork = compact(network);
  const normalizedSymbol = compact(symbol);

  if (normalizedNetwork.includes('bitcoin') && !normalizedNetwork.includes('cash')) return 'bitcoin';
  if (normalizedNetwork.includes('bitcoincash') || normalizedSymbol === 'bch') return 'bitcoin-cash';
  if (normalizedNetwork.includes('dogecoin') || normalizedSymbol === 'doge') return 'dogecoin';
  if (normalizedNetwork.includes('litecoin') || normalizedSymbol === 'ltc') return 'litecoin';
  if (normalizedNetwork.includes('solana') || normalizedSymbol === 'sol') return 'solana';
  if (normalizedNetwork.includes('tron') || normalizedNetwork.includes('trc20') || normalizedSymbol === 'trx') return 'tron';
  if (normalizedNetwork.includes('ethereum') || normalizedNetwork.includes('erc20') || EVM_CHAIN_IDS[normalizedNetwork]) return 'ethereum';

  if (normalizedSymbol === 'btc') return 'bitcoin';
  if (normalizedSymbol === 'eth') return 'ethereum';
  return 'unknown';
}

function validateBase58check(address: string, allowedVersions: number[]) {
  try {
    const decoded = base58check.decode(address);
    return decoded.length === 21 && allowedVersions.includes(decoded[0]);
  } catch {
    return false;
  }
}

function validateBitcoin(address: string) {
  if (validateBase58check(address, [0x00, 0x05])) return true;

  for (const decoder of [bech32, bech32m]) {
    try {
      const decoded = decoder.decode(address, 90);
      if (decoded.prefix !== 'bc' || decoded.words.length < 2) continue;
      const [version, ...programWords] = decoded.words;
      const program = decoder.fromWords(programWords);
      if (version === 0) {
        if (decoder === bech32 && (program.length === 20 || program.length === 32)) return true;
        continue;
      }
      if (decoder === bech32m && version >= 1 && version <= 16 && program.length >= 2 && program.length <= 40) return true;
    } catch {
      // Try the other checksum variant.
    }
  }
  return false;
}

function validateEthereum(address: string) {
  // EIP-681 accepts a 0x-prefixed 20-byte hexadecimal address. Mixed-case
  // addresses may use EIP-55, but EIP-681 does not require that checksum.
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

function validateSolana(address: string) {
  try {
    return base58.decode(address).length === 32;
  } catch {
    return false;
  }
}

function validateTron(address: string) {
  return validateBase58check(address, [0x41]);
}

function isSafeCustomPayload(payload: string, address: string) {
  if (!payload || payload.length > 2048 || hasControlCharacters(payload)) return false;
  if (payload === address) return true;

  const hasUriScheme = /^[a-z][a-z0-9+.-]*:/i.test(payload);
  if (!hasUriScheme) return false;

  try {
    return decodeURIComponent(payload).toLowerCase().includes(address.toLowerCase());
  } catch {
    return payload.toLowerCase().includes(address.toLowerCase());
  }
}

function isNativeAsset(symbol?: string | null, network?: string | null, family?: NetworkFamily) {
  const normalizedSymbol = (symbol || '').trim().toUpperCase();
  if (!normalizedSymbol) return true;
  if (family === 'bitcoin') return normalizedSymbol === 'BTC';
  if (family === 'bitcoin-cash') return normalizedSymbol === 'BCH';
  if (family === 'dogecoin') return normalizedSymbol === 'DOGE';
  if (family === 'litecoin') return normalizedSymbol === 'LTC';
  if (family === 'solana') return normalizedSymbol === 'SOL';
  if (family === 'tron') return normalizedSymbol === 'TRX';
  if (family === 'ethereum') {
    return (EVM_NATIVE_SYMBOLS[compact(network)] || ['ETH']).includes(normalizedSymbol);
  }
  return false;
}

function automaticPayload(wallet: CryptoPaymentWallet, family: NetworkFamily, address: string) {
  const nativeAsset = isNativeAsset(wallet.symbol, wallet.network, family);
  if (!nativeAsset) {
    return {
      payload: address,
      format: 'Wallet address (token network)',
    };
  }

  switch (family) {
    case 'bitcoin':
      return { payload: `bitcoin:${address}`, format: 'Bitcoin payment URI' };
    case 'ethereum': {
      const chainId = EVM_CHAIN_IDS[compact(wallet.network)];
      return {
        payload: `ethereum:${address}${chainId ? `@${chainId}` : ''}`,
        format: chainId ? `EIP-681 payment URI (chain ${chainId})` : 'EIP-681 payment URI',
      };
    }
    case 'solana':
      return { payload: `solana:${address}`, format: 'Solana Pay transfer URI' };
    case 'dogecoin':
      return { payload: `dogecoin:${address}`, format: 'Dogecoin payment URI' };
    case 'litecoin':
      return { payload: `litecoin:${address}`, format: 'Litecoin payment URI' };
    case 'bitcoin-cash':
      return { payload: address.startsWith('bitcoincash:') ? address : `bitcoincash:${address}`, format: 'Bitcoin Cash payment URI' };
    default:
      return { payload: address, format: 'Wallet address' };
  }
}

export function getCryptoPaymentRequest(wallet: CryptoPaymentWallet): CryptoPaymentRequest {
  const address = (wallet.wallet_address || '').trim();
  const family = resolveNetworkFamily(wallet.symbol, wallet.network);
  let valid = false;

  if (!address) {
    return {
      address,
      payload: '',
      valid: false,
      format: 'Unavailable',
      error: 'No wallet address is configured.',
      usesCustomUri: false,
    };
  }

  switch (family) {
    case 'bitcoin':
      valid = validateBitcoin(address);
      break;
    case 'ethereum':
      valid = validateEthereum(address);
      break;
    case 'solana':
      valid = validateSolana(address);
      break;
    case 'dogecoin':
      valid = validateBase58check(address, [0x1e, 0x16]);
      break;
    case 'litecoin':
      valid = address.toLowerCase().startsWith('ltc1')
        ? Boolean(bech32.decodeUnsafe(address, 90))
        : validateBase58check(address, [0x30, 0x32, 0x05]);
      break;
    case 'bitcoin-cash':
      valid = /^(?:bitcoincash:)?(?:q|p)[a-z0-9]{41,61}$/i.test(address);
      break;
    case 'tron':
      valid = validateTron(address);
      break;
    default:
      valid = address.length <= 512 && !/\s/.test(address) && !hasControlCharacters(address);
  }

  if (!valid) {
    const networkLabel = wallet.network?.trim() || wallet.symbol?.trim() || 'selected network';
    return {
      address,
      payload: '',
      valid: false,
      format: 'Invalid wallet address',
      error: `This is not a valid ${networkLabel} wallet address.`,
      usesCustomUri: false,
    };
  }

  const customUri = (wallet.payment_uri || '').trim();
  if (customUri) {
    if (!isSafeCustomPayload(customUri, address)) {
      return {
        address,
        payload: '',
        valid: false,
        format: 'Invalid payment URI',
        error: 'The custom payment URI must be a valid URI containing this wallet address.',
        usesCustomUri: true,
      };
    }

    return {
      address,
      payload: customUri,
      valid: true,
      format: 'Custom wallet payment URI',
      error: null,
      usesCustomUri: true,
    };
  }

  const automatic = automaticPayload(wallet, family, address);
  return {
    address,
    payload: automatic.payload,
    valid: true,
    format: automatic.format,
    error: null,
    usesCustomUri: false,
  };
}
