import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { RPC_URL } from './config';

dotenv.config();

async function main() {
  try {
    console.log('🪙 Creating SKY0 Token on Devnet\n');
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

    // Create SKY0 token mint
    console.log('🔨 Creating SKY0 token mint...');
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey, // Mint authority
      wallet.publicKey, // Freeze authority
      9 // 9 decimals (like SOL)
    );

    console.log('✅ SKY0 Token Created!');
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
    console.log('💎 Minting 1,000,000 SKY0 tokens...');
    const mintAmount = 1_000_000 * 10 ** 9; // 1 million tokens with 9 decimals
    await mintTo(
      connection,
      wallet,
      mint,
      tokenAccount.address,
      wallet.publicKey,
      mintAmount
    );

    console.log('✅ Tokens Minted!');
    console.log('Amount:', mintAmount / 10 ** 9, 'SKY0');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('SKY0 Mint Address:', mint.toBase58());
    console.log('Your Token Account:', tokenAccount.address.toBase58());
    console.log('Balance:', mintAmount / 10 ** 9, 'SKY0');
    console.log('');
    console.log('⚠️  IMPORTANT: Update src/config.ts with this mint address:');
    console.log(`export const BASE_TOKEN_MINT = new PublicKey('${mint.toBase58()}');`);
    console.log('');
    console.log('Then run: npm run create-market');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
