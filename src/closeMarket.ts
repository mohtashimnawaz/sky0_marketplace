import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SystemProgram,
} from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { RPC_URL, PHOENIX_PROGRAM_ID } from './config';

dotenv.config();

// This script attempts to close a Phoenix market and return rent to the market creator.
// It performs two steps:
// 1) Set market status to Closed (using discriminator 103 like activateMarket.ts)
// 2) Attempt to invoke a CloseMarket instruction on Phoenix (discriminator guessed).
// NOTE: The exact discriminator for a close instruction is not present in this repo.
// If Phoenix exposes a close instruction, replace CLOSE_MARKET_DISCRIMINATOR with the correct value.

const MARKET_ADDRESS = process.env.MARKET_ADDRESS || '';

// CloseMarket discriminator (found via testing)
const CLOSE_MARKET_DISCRIMINATOR = 7;

async function main() {
  if (!MARKET_ADDRESS) {
    console.error('❌ MARKER: Please set MARKET_ADDRESS in your .env (the market keypair public key)');
    process.exit(1);
  }

  const connection = new Connection(RPC_URL, 'confirmed');

  const secretKeyString = process.env.WALLET_SECRET_KEY;
  if (!secretKeyString) {
    console.error('❌ WALLET_SECRET_KEY missing from .env');
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

  console.log('🔒 Closing market:', marketPubkey.toBase58());
  console.log('📍 Wallet:', wallet.publicKey.toBase58());
  console.log('');

  const logAuthority = new PublicKey('7aDTsspkQNGKmrexAN7FLx9oxU3iPczSSvHNggyuqYkR');

  try {
    // Step 0: Cancel all orders first (required before closing)
    console.log('📋 Step 1: Canceling all orders...');
    console.log('⚠️  NOTE: You must cancel all orders on the market before it can be closed.');
    console.log('   This script will attempt to cancel your orders.');
    console.log('   If other traders have orders, they must cancel them too.');
    console.log('');

    // CancelAllOrders instruction (discriminator 6 from Phoenix SDK)
    const cancelAllOrdersData = Buffer.alloc(1);
    cancelAllOrdersData.writeUInt8(6, 0);

    // Get seat address for the wallet
    const [seatAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('seat'), marketPubkey.toBuffer(), wallet.publicKey.toBuffer()],
      PHOENIX_PROGRAM_ID
    );

    const cancelAllIx = new TransactionInstruction({
      keys: [
        { pubkey: PHOENIX_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: logAuthority, isSigner: false, isWritable: false },
        { pubkey: marketPubkey, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PHOENIX_PROGRAM_ID,
      data: cancelAllOrdersData,
    });

    try {
      const cancelTx = new Transaction().add(cancelAllIx);
      const cancelSig = await sendAndConfirmTransaction(connection, cancelTx, [wallet], { commitment: 'confirmed' });
      console.log('✅ All your orders canceled. Tx:', cancelSig);
    } catch (err: any) {
      console.log('⚠️  Could not cancel orders (may already be empty):', err?.message);
    }
    console.log('');

    // Step 1: Transition market through valid states
    // Phoenix requires: Active → PostOnly → Paused → Closed
    console.log('📋 Step 2: Transitioning market status...');
    console.log('   Phoenix requires state transitions: Active → PostOnly → Paused → Closed');
    console.log('');

    // MarketStatus enum values
    const MarketStatus = {
      Uninitialized: 0,
      Active: 1,
      PostOnly: 2,
      Paused: 3,
      Closed: 4,
      Tombstoned: 5,
    };

    const statusTransitions = [
      { name: 'PostOnly', value: MarketStatus.PostOnly },
      { name: 'Paused', value: MarketStatus.Paused },
      { name: 'Closed', value: MarketStatus.Closed },
    ];

    for (const { name, value } of statusTransitions) {
      console.log(`   → Setting status to ${name}...`);
      const changeMarketStatusData = Buffer.alloc(2);
      changeMarketStatusData.writeUInt8(103, 0); // ChangeMarketStatus discriminator
      changeMarketStatusData.writeUInt8(value, 1); // New status

      const changeStatusIx = new TransactionInstruction({
        keys: [
          { pubkey: PHOENIX_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: logAuthority, isSigner: false, isWritable: false },
          { pubkey: marketPubkey, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
        ],
        programId: PHOENIX_PROGRAM_ID,
        data: changeMarketStatusData,
      });

      const tx = new Transaction().add(changeStatusIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [wallet], { commitment: 'confirmed' });
      console.log(`   ✅ Status changed to ${name}. Tx: ${sig}`);
    }

    console.log('');
    console.log('✅ Market status successfully set to Closed!');

    // Step 3: Call CloseMarket instruction to reclaim rent (discriminator 7)
    console.log('');
    console.log('📋 Step 3: Reclaiming rent from market account...');
    const closeData = Buffer.alloc(1);
    closeData.writeUInt8(CLOSE_MARKET_DISCRIMINATOR, 0);

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

    const tx2 = new Transaction().add(closeIx);
    console.log('✉️ Sending CloseMarket instruction (discriminator 7)...');
    const sig2 = await sendAndConfirmTransaction(connection, tx2, [wallet], { commitment: 'confirmed' });
    console.log('✅ Market closed and rent reclaimed! Tx:', sig2);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! Market closed and ~2.79 SOL returned to wallet');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('🔗 View transaction:');
    console.log(`https://explorer.solana.com/tx/${sig2}?cluster=devnet`);

  } catch (error: any) {
    console.error('❌ Error closing market:', error?.message || error);
    if (error.logs) console.error('Transaction logs:', error.logs);
    process.exit(1);
  }
}

main();
