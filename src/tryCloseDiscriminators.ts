import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { RPC_URL, PHOENIX_PROGRAM_ID } from './config';

dotenv.config();

// Try multiple discriminator values to find the correct CloseMarket instruction
const MARKET_ADDRESS = process.env.MARKET_ADDRESS || '';

async function tryDiscriminator(
  connection: Connection,
  wallet: Keypair,
  marketPubkey: PublicKey,
  discriminator: number
): Promise<boolean> {
  const logAuthority = new PublicKey('7aDTsspkQNGKmrexAN7FLx9oxU3iPczSSvHNggyuqYkR');
  
  const closeData = Buffer.alloc(1);
  closeData.writeUInt8(discriminator, 0);

  const closeIx = new TransactionInstruction({
    keys: [
      { pubkey: PHOENIX_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: logAuthority, isSigner: false, isWritable: false },
      { pubkey: marketPubkey, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PHOENIX_PROGRAM_ID,
    data: closeData,
  });

  try {
    // Simulate only - don't actually send
    const tx = new Transaction().add(closeIx);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = wallet.publicKey;
    tx.sign(wallet);

    const simulation = await connection.simulateTransaction(tx);
    
    if (!simulation.value.err) {
      return true; // Success!
    }
    return false;
  } catch (err) {
    return false;
  }
}

async function main() {
  if (!MARKET_ADDRESS) {
    console.error('❌ Set MARKET_ADDRESS in .env');
    process.exit(1);
  }

  const connection = new Connection(RPC_URL, 'confirmed');
  const secretKeyString = process.env.WALLET_SECRET_KEY;
  if (!secretKeyString) {
    console.error('❌ WALLET_SECRET_KEY missing');
    process.exit(1);
  }

  let wallet: Keypair;
  try {
    const secretKey = bs58.decode(secretKeyString);
    wallet = Keypair.fromSecretKey(secretKey);
  } catch (e) {
    const secretKey = new Uint8Array(JSON.parse(secretKeyString));
    wallet = Keypair.fromSecretKey(secretKey);
  }

  const marketPubkey = new PublicKey(MARKET_ADDRESS);

  console.log('🔍 Testing discriminators for CloseMarket instruction...');
  console.log('Market:', marketPubkey.toBase58());
  console.log('');

  // Try common discriminator ranges
  const discriminatorsToTry = [
    // Common ranges
    ...Array.from({ length: 20 }, (_, i) => i), // 0-19
    // Around known Phoenix discriminators
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115,
    // Other common values
    200, 201, 202, 203, 204, 205,
    250, 251, 252, 253, 254, 255,
  ];

  for (const disc of discriminatorsToTry) {
    process.stdout.write(`Testing discriminator ${disc}...`);
    const success = await tryDiscriminator(connection, wallet, marketPubkey, disc);
    if (success) {
      console.log(' ✅ SUCCESS!');
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🎉 Found working discriminator:', disc);
      console.log('═══════════════════════════════════════════════════════════');
      return;
    } else {
      console.log(' ❌');
    }
  }

  console.log('');
  console.log('⚠️  No working discriminator found in tested range.');
  console.log('Phoenix may not expose a CloseMarket instruction, or it requires different accounts.');
}

main().catch(console.error);
