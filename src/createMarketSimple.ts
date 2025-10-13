import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { Client } from '@ellipsis-labs/phoenix-sdk';
import {
  RPC_URL,
  BASE_TOKEN_MINT,
  QUOTE_TOKEN_MINT,
} from './config';

dotenv.config();

async function main() {
  try {
    console.log('🔍 Checking Phoenix SDK capabilities...\n');
    
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
    
    console.log('Wallet:', wallet.publicKey.toBase58());
    console.log('');
    
    // Try to create Phoenix client
    console.log('Creating Phoenix client...');
    const client = await Client.create(connection);
    
    console.log('✅ Phoenix client created');
    console.log('Available markets:', client.marketConfigs.size);
    console.log('');
    
    // List available methods
    console.log('Client methods:');
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
    console.log('');
    
    console.log('⚠️  Market initialization is typically done through the Phoenix CLI or web interface.');
    console.log('The SDK does not expose a direct createMarket function.');
    console.log('');
    console.log('Options:');
    console.log('1. Use Phoenix CLI: https://github.com/Ellipsis-Labs/phoenix-cli');
    console.log('2. Use Phoenix web interface');
    console.log('3. Manually construct the instruction (requires deep knowledge of Phoenix internals)');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
