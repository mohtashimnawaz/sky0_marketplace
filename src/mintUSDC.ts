import { Connection, Keypair } from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { RPC_URL, QUOTE_TOKEN_MINT } from './config';

dotenv.config();

async function main() {
  try {
    console.log('💵 Minting USDC to your account\n');

    const connection = new Connection(RPC_URL, 'confirmed');

    const secretKeyString = process.env.WALLET_SECRET_KEY;
    if (!secretKeyString) {
      throw new Error('WALLET_SECRET_KEY not found in .env file');
    }

    let wallet: Keypair;
    try {
      const secretKey = bs58.decode(secretKeyString);
      wallet = Keypair.fromSecretKey(secretKey);
    } catch (e) {
      const secretKey = new Uint8Array(JSON.parse(secretKeyString));
      wallet = Keypair.fromSecretKey(secretKey);
    }

    console.log('📍 Wallet:', wallet.publicKey.toBase58());
    console.log('💵 USDC Mint:', QUOTE_TOKEN_MINT.toBase58());
    console.log('');

    // Get or create token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      QUOTE_TOKEN_MINT,
      wallet.publicKey
    );

    console.log('📦 Token Account:', tokenAccount.address.toBase58());
    console.log('');

    // Mint 10,000 USDC
    console.log('💎 Minting 10,000 USDC...');
    const mintAmount = 10_000 * 10 ** 6; // 10,000 USDC with 6 decimals
    await mintTo(
      connection,
      wallet,
      QUOTE_TOKEN_MINT,
      tokenAccount.address,
      wallet.publicKey,
      mintAmount
    );

    console.log('✅ Minted 10,000 USDC!');
    console.log('');
    console.log('Now run: npm run bootstrap-liquidity');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
