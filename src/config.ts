import { PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

export const RPC_URL = 'https://api.devnet.solana.com';

// Phoenix Program ID for Devnet
export const PHOENIX_PROGRAM_ID = new PublicKey('PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY');

// Token Mints
export const BASE_TOKEN_MINT = new PublicKey('Aw2iBfFyu62oLstr5xhJkcHoJBSZc8iN8sRMkw9rXnaz'); // SKY0 (created on devnet)
export const QUOTE_TOKEN_MINT = new PublicKey('F7VFR1GFUTNAqdPkyCWJvKMV6zrSFW5wjWFGj22Rfas1'); // USDC (your own mint)

// Fee Collector (replace with your wallet public key)
export const FEE_COLLECTOR = new PublicKey(process.env.WALLET_PUBLIC_KEY || 'YOUR_WALLET_PUBLIC_KEY_HERE');
