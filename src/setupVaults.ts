import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { RPC_URL, PHOENIX_PROGRAM_ID, BASE_TOKEN_MINT, QUOTE_TOKEN_MINT } from './config';

dotenv.config();

interface VaultAddresses {
  baseVault: string;
  quoteVault: string;
  baseVaultPDA: string;
  quoteVaultPDA: string;
}

async function deriveVaultPDAs(marketPubkey: PublicKey): Promise<{ baseVaultPDA: PublicKey; quoteVaultPDA: PublicKey }> {
  // Phoenix uses specific seeds for vault PDAs
  // Typically: [b"vault", market_pubkey, token_mint]
  
  const [baseVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), marketPubkey.toBuffer(), BASE_TOKEN_MINT.toBuffer()],
    PHOENIX_PROGRAM_ID
  );
  
  const [quoteVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), marketPubkey.toBuffer(), QUOTE_TOKEN_MINT.toBuffer()],
    PHOENIX_PROGRAM_ID
  );
  
  return { baseVaultPDA, quoteVaultPDA };
}

async function checkOrCreateATA(
  connection: Connection,
  wallet: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(mint, owner, true);
  
  try {
    await getAccount(connection, ata);
    console.log(`✅ Token account exists: ${ata.toBase58()}`);
  } catch (error) {
    console.log(`⚠️  Token account doesn't exist, would need to create: ${ata.toBase58()}`);
    console.log(`   (Creation requires transaction - not executed in this script)`);
  }
  
  return ata;
}

async function main() {
  try {
    console.log('🚀 Setting up Phoenix DEX Vaults for SKY0/USDC Market\n');
    
    // Connect to Solana RPC
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
    
    // For demonstration, we'll use a deterministic market pubkey
    // In production, this would be the actual market address after creation
    const [marketPubkey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('phoenix'),
        Buffer.from('market'),
        BASE_TOKEN_MINT.toBuffer(),
        QUOTE_TOKEN_MINT.toBuffer(),
      ],
      PHOENIX_PROGRAM_ID
    );
    
    console.log('📍 Market Address (derived):', marketPubkey.toBase58());
    console.log('');
    
    // Derive vault PDAs using Phoenix conventions
    console.log('🔑 Deriving Vault PDAs...');
    const { baseVaultPDA, quoteVaultPDA } = await deriveVaultPDAs(marketPubkey);
    
    console.log('Base Vault PDA (SKY0):', baseVaultPDA.toBase58());
    console.log('Quote Vault PDA (USDC):', quoteVaultPDA.toBase58());
    console.log('');
    
    // Check if vault accounts exist on-chain
    console.log('🔍 Checking vault accounts on-chain...');
    
    try {
      const baseVaultInfo = await connection.getAccountInfo(baseVaultPDA);
      if (baseVaultInfo) {
        console.log('✅ Base vault exists on-chain');
      } else {
        console.log('⚠️  Base vault does not exist yet (will be created with market)');
      }
    } catch (error) {
      console.log('⚠️  Base vault does not exist yet (will be created with market)');
    }
    
    try {
      const quoteVaultInfo = await connection.getAccountInfo(quoteVaultPDA);
      if (quoteVaultInfo) {
        console.log('✅ Quote vault exists on-chain');
      } else {
        console.log('⚠️  Quote vault does not exist yet (will be created with market)');
      }
    } catch (error) {
      console.log('⚠️  Quote vault does not exist yet (will be created with market)');
    }
    
    console.log('');
    
    // Check user's ATAs for trading
    console.log('🔍 Checking user token accounts...');
    const userBaseATA = await checkOrCreateATA(connection, wallet, BASE_TOKEN_MINT, wallet.publicKey);
    const userQuoteATA = await checkOrCreateATA(connection, wallet, QUOTE_TOKEN_MINT, wallet.publicKey);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 VAULT ADDRESSES SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Base Vault (SKY0):', baseVaultPDA.toBase58());
    console.log('Quote Vault (USDC):', quoteVaultPDA.toBase58());
    console.log('');
    console.log('User Base ATA:', userBaseATA.toBase58());
    console.log('User Quote ATA:', userQuoteATA.toBase58());
    console.log('');
    
    // Return as JSON
    const vaultAddresses: VaultAddresses = {
      baseVault: baseVaultPDA.toBase58(),
      quoteVault: quoteVaultPDA.toBase58(),
      baseVaultPDA: baseVaultPDA.toBase58(),
      quoteVaultPDA: quoteVaultPDA.toBase58(),
    };
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📄 JSON OUTPUT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(JSON.stringify(vaultAddresses, null, 2));
    
    return vaultAddresses;
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
