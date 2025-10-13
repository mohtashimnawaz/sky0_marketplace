import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { RPC_URL, PHOENIX_PROGRAM_ID } from './config';

// Market status enum
enum MarketStatus {
  Uninitialized = 0,
  Active = 1,
  PostOnly = 2,
  Paused = 3,
  Closed = 4,
  Tombstoned = 5,
}

// Seat approval status enum
enum SeatApprovalStatus {
  NotApproved = 0,
  Approved = 1,
  Retired = 2,
}

dotenv.config();

const MARKET_ADDRESS = 'xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru';

async function main() {
  try {
    console.log('🔓 Activating Market and Approving Seat\n');
    console.log('═══════════════════════════════════════════════════════════');

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
    console.log('📊 Market:', MARKET_ADDRESS);
    console.log('');

    // Change market status to Active
    console.log('🔓 Activating market...');
    
    // Instruction discriminator for ChangeMarketStatus = 103
    const changeMarketStatusData = Buffer.alloc(2);
    changeMarketStatusData.writeUInt8(103, 0); // Discriminator
    changeMarketStatusData.writeUInt8(MarketStatus.Active, 1); // Market status
    
    const changeMarketStatusIx = new TransactionInstruction({
      keys: [
        { pubkey: PHOENIX_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: new PublicKey('7aDTsspkQNGKmrexAN7FLx9oxU3iPczSSvHNggyuqYkR'), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(MARKET_ADDRESS), isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
      ],
      programId: PHOENIX_PROGRAM_ID,
      data: changeMarketStatusData,
    });

    const activateTx = new Transaction().add(changeMarketStatusIx);
    const activateSig = await sendAndConfirmTransaction(connection, activateTx, [wallet], {
      commitment: 'confirmed',
    });

    console.log('✅ Market activated!');
    console.log('   Tx:', activateSig);
    console.log('');

    // Get seat address
    const [seatAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('seat'), new PublicKey(MARKET_ADDRESS).toBuffer(), wallet.publicKey.toBuffer()],
      PHOENIX_PROGRAM_ID
    );

    // Approve seat
    console.log('✅ Approving seat...');
    
    // Instruction discriminator for ChangeSeatStatus = 104
    const changeSeatStatusData = Buffer.alloc(2);
    changeSeatStatusData.writeUInt8(104, 0); // Discriminator
    changeSeatStatusData.writeUInt8(SeatApprovalStatus.Approved, 1); // Seat status
    
    const changeSeatStatusIx = new TransactionInstruction({
      keys: [
        { pubkey: PHOENIX_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: new PublicKey('7aDTsspkQNGKmrexAN7FLx9oxU3iPczSSvHNggyuqYkR'), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(MARKET_ADDRESS), isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: seatAddress, isSigner: false, isWritable: true },
      ],
      programId: PHOENIX_PROGRAM_ID,
      data: changeSeatStatusData,
    });

    const approveTx = new Transaction().add(changeSeatStatusIx);
    const approveSig = await sendAndConfirmTransaction(connection, approveTx, [wallet], {
      commitment: 'confirmed',
    });

    console.log('✅ Seat approved!');
    console.log('   Tx:', approveSig);
    console.log('   Seat:', seatAddress.toBase58());
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Market is now active and your seat is approved!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Now run: npm run bootstrap-liquidity');

  } catch (error: any) {
    console.error('❌ Error:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    process.exit(1);
  }
}

main();
