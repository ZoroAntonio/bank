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
  fantom: 250,
  fantomopera: 250,
  gnosis: 100,
  gnosischain: 100,
  celo: 42220,
  cronos: 25,
  moonbeam: 1284,
  moonriver: 1285,
  zksync: 324,
  zksyncera: 324,
  linea: 59144,
  scroll: 534352,
  mantle: 5000,
  blast: 81457,
  opbnb: 204,
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
  fantom: ['FTM'],
  fantomopera: ['FTM'],
  gnosis: ['XDAI'],
  gnosischain: ['XDAI'],
  celo: ['CELO'],
  cronos: ['CRO'],
  moonbeam: ['GLMR'],
  moonriver: ['MOVR'],
  zksync: ['ETH'],
  zksyncera: ['ETH'],
  linea: ['ETH'],
  scroll: ['ETH'],
  mantle: ['MNT'],
  blast: ['ETH'],
  opbnb: ['BNB'],
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

const CASHADDR_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const CASHADDR_GENERATORS = [
  0x98f2bc8e61n,
  0x79b76d99e2n,
  0xf33e5fb3c4n,
  0xae2eabe2a8n,
  0x1e4f43e470n,
];

function cashAddressPolymod(values: number[]) {
  let checksum = 1n;
  values.forEach((value) => {
    const top = checksum >> 35n;
    checksum = ((checksum & 0x07ffffffffn) << 5n) ^ BigInt(value);
    CASHADDR_GENERATORS.forEach((generator, index) => {
      if ((top >> BigInt(index)) & 1n) checksum ^= generator;
    });
  });
  return checksum ^ 1n;
}

function validateBitcoinCash(address: string) {
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) return false;

  const normalized = address.toLowerCase();
  const separatorIndex = normalized.indexOf(':');
  const prefix = separatorIndex >= 0 ? normalized.slice(0, separatorIndex) : 'bitcoincash';
  const payload = separatorIndex >= 0 ? normalized.slice(separatorIndex + 1) : normalized;
  if (prefix !== 'bitcoincash' || payload.length < 42 || payload.length > 112) return false;

  const values = Array.from(payload, (character) => CASHADDR_CHARSET.indexOf(character));
  if (values.some((value) => value < 0)) return false;
  const prefixValues = [...Array.from(prefix, (character) => character.charCodeAt(0) & 31), 0];
  return cashAddressPolymod([...prefixValues, ...values]) === 0n;
}

function validateLitecoin(address: string) {
  if (validateBase58check(address, [0x30, 0x32, 0x05])) return true;

  for (const decoder of [bech32, bech32m]) {
    try {
      const decoded = decoder.decode(address, 90);
      if (decoded.prefix !== 'ltc' || decoded.words.length < 2) continue;
      const [version, ...programWords] = decoded.words;
      const program = decoder.fromWords(programWords);
      if (version === 0 && decoder === bech32 && (program.length === 20 || program.length === 32)) return true;
      if (version >= 1 && version <= 16 && decoder === bech32m && program.length >= 2 && program.length <= 40) return true;
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
      valid = validateLitecoin(address);
      break;
    case 'bitcoin-cash':
      valid = validateBitcoinCash(address);
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
