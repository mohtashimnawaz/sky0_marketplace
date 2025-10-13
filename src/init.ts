import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { RPC_URL } from './config';

dotenv.config();

async function main() {
  try {
    // Connect to Solana RPC
    console.log('Connecting to Solana devnet...');
    const connection = new Connection(RPC_URL, 'confirmed');
    
    // Load wallet from environment variable
    const secretKeyString = process.env.WALLET_SECRET_KEY;
    if (!secretKeyString) {
      throw new Error('WALLET_SECRET_KEY not found in .env file');
    }
    
    let wallet: Keypair;
    
    // Try to parse as base58 first, then as JSON array
    try {
      const secretKey = bs58.decode(secretKeyString);
      wallet = Keypair.fromSecretKey(secretKey);
    } catch (e) {
      // Try parsing as comma-separated numbers or JSON array
      const secretKey = new Uint8Array(JSON.parse(secretKeyString));
      wallet = Keypair.fromSecretKey(secretKey);
    }
    
    console.log('\n✅ Wallet loaded successfully!');
    console.log('Public Key:', wallet.publicKey.toBase58());
    
    // Get wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    const balanceInSOL = balance / LAMPORTS_PER_SOL;
    
    console.log('Balance:', balanceInSOL, 'SOL');
    
    if (balanceInSOL === 0) {
      console.log('\n⚠️  Your wallet has no SOL. Request devnet SOL from:');
      console.log('https://faucet.solana.com');
    }
    
    // Test connection
    const version = await connection.getVersion();
    console.log('\n✅ Connected to Solana');
    console.log('Cluster version:', version['solana-core']);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
