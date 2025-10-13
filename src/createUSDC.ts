import { Connection, Keypair } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { RPC_URL } from './config';

dotenv.config();

async function main() {
  try {
    console.log('💵 Creating USDC Token on Devnet\n');
    console.log('═══════════════════════════════════════════════════════════');

    // Connect to Solana
    const connection = new Connection(RPC_URL, 'confirmed');

    // Load wallet
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

    // Check balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log('💰 Balance:', balance / 1e9, 'SOL');
    console.log('');

    // Create USDC token mint (6 decimals like real USDC)
    console.log('🔨 Creating USDC token mint...');
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey, // Mint authority
      wallet.publicKey, // Freeze authority
      6 // 6 decimals (standard for USDC)
    );

    console.log('✅ USDC Token Created!');
    console.log('Mint Address:', mint.toBase58());
    console.log('');

    // Create associated token account
    console.log('📦 Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );

    console.log('✅ Token Account Created!');
    console.log('Token Account:', tokenAccount.address.toBase58());
    console.log('');

    // Mint some tokens
    console.log('💎 Minting 10,000,000 USDC tokens...');
    const mintAmount = 10_000_000 * 10 ** 6; // 10 million USDC with 6 decimals
    await mintTo(
      connection,
      wallet,
      mint,
      tokenAccount.address,
      wallet.publicKey,
      mintAmount
    );

    console.log('✅ Tokens Minted!');
    console.log('Amount:', mintAmount / 10 ** 6, 'USDC');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('USDC Mint Address:', mint.toBase58());
    console.log('Your Token Account:', tokenAccount.address.toBase58());
    console.log('Balance:', mintAmount / 10 ** 6, 'USDC');
    console.log('');
    console.log('⚠️  IMPORTANT: Update src/config.ts with this mint address:');
    console.log(`export const QUOTE_TOKEN_MINT = new PublicKey('${mint.toBase58()}');`);
    console.log('');
    console.log('Then run: npm run create-market');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
