import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import {
  RPC_URL,
  PHOENIX_PROGRAM_ID,
  BASE_TOKEN_MINT,
  QUOTE_TOKEN_MINT,
  FEE_COLLECTOR,
} from './config';
import { getSeatManagerAddress, getSeatAddress } from '@ellipsis-labs/phoenix-sdk';

dotenv.config();

// Market size parameters
interface MarketSizeParams {
  bidsSize: bigint;
  asksSize: bigint;
  numSeats: bigint;
}

// Initialize market instruction data
interface InitializeMarketParams {
  tickSizeInQuoteLotsPerBaseUnit: bigint;
  numBaseLotsPerBaseUnit: bigint;
  numQuoteLotsPerQuoteUnit: bigint;
  takerFeeBps: number;
  marketSizeParams: MarketSizeParams;
}

// Borsh serialization for Phoenix InitializeMarket instruction
// Based on InitializeParams struct from Phoenix source
function serializeInitializeMarket(params: InitializeMarketParams): Buffer {
  // Borsh format for InitializeParams:
  // - market_size_params: MarketSizeParams (3 x u64)
  // - num_quote_lots_per_quote_unit: u64
  // - tick_size_in_quote_lots_per_base_unit: u64
  // - num_base_lots_per_base_unit: u64
  // - taker_fee_bps: u16
  // - fee_collector: Pubkey (32 bytes)
  // - raw_base_units_per_base_unit: Option<u32> (1 byte + 4 bytes if Some)

  const buffer = Buffer.alloc(8 + 8 + 8 + 8 + 8 + 8 + 2 + 32 + 1);
  let offset = 0;

  // MarketSizeParams (bidsSize, asksSize, numSeats)
  buffer.writeBigUInt64LE(params.marketSizeParams.bidsSize, offset);
  offset += 8;
  buffer.writeBigUInt64LE(params.marketSizeParams.asksSize, offset);
  offset += 8;
  buffer.writeBigUInt64LE(params.marketSizeParams.numSeats, offset);
  offset += 8;

  // num_quote_lots_per_quote_unit (u64)
  buffer.writeBigUInt64LE(params.numQuoteLotsPerQuoteUnit, offset);
  offset += 8;

  // tick_size_in_quote_lots_per_base_unit (u64)
  buffer.writeBigUInt64LE(params.tickSizeInQuoteLotsPerBaseUnit, offset);
  offset += 8;

  // num_base_lots_per_base_unit (u64)
  buffer.writeBigUInt64LE(params.numBaseLotsPerBaseUnit, offset);
  offset += 8;

  // taker_fee_bps (u16)
  buffer.writeUInt16LE(params.takerFeeBps, offset);
  offset += 2;

  // fee_collector (Pubkey - 32 bytes)
  FEE_COLLECTOR.toBuffer().copy(buffer, offset);
  offset += 32;

  // raw_base_units_per_base_unit (Option<u32>) - None = 0
  buffer.writeUInt8(0, offset);

  return buffer;
}

async function deriveMarketAccounts(marketPubkey: PublicKey) {
  // Derive PDAs for market accounts
  const [baseVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), marketPubkey.toBuffer(), BASE_TOKEN_MINT.toBuffer()],
    PHOENIX_PROGRAM_ID
  );

  const [quoteVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), marketPubkey.toBuffer(), QUOTE_TOKEN_MINT.toBuffer()],
    PHOENIX_PROGRAM_ID
  );

  const [eventQueue] = PublicKey.findProgramAddressSync(
    [Buffer.from('event_queue'), marketPubkey.toBuffer()],
    PHOENIX_PROGRAM_ID
  );

  const [bids] = PublicKey.findProgramAddressSync(
    [Buffer.from('bids'), marketPubkey.toBuffer()],
    PHOENIX_PROGRAM_ID
  );

  const [asks] = PublicKey.findProgramAddressSync(
    [Buffer.from('asks'), marketPubkey.toBuffer()],
    PHOENIX_PROGRAM_ID
  );

  return { baseVault, quoteVault, eventQueue, bids, asks };
}

async function main() {
  try {
    console.log('🚀 Creating SKY0/USDC Market on Phoenix DEX\n');
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

    if (balance < 3 * 1e9) {
      console.log('⚠️  Insufficient balance. You need at least 3 SOL for market creation.');
      console.log('   Current balance:', balance / 1e9, 'SOL');
      console.log('   Get more devnet SOL from: https://faucet.solana.com');
      console.log('');
      console.log('   Run this command to request SOL:');
      console.log(`   solana airdrop 5 ${wallet.publicKey.toBase58()} --url devnet`);
      process.exit(1);
    }

    console.log('');

    // Generate a new keypair for the market (NOT a PDA!)
    const marketKeypair = Keypair.generate();
    const marketPubkey = marketKeypair.publicKey;

    console.log('📊 Market Address:', marketPubkey.toBase58());
    console.log('⚠️  IMPORTANT: Save this market keypair if you need to manage it later!');
    console.log('');

    // Derive all required accounts
    console.log('🔑 Deriving market accounts...');
    const { baseVault, quoteVault, eventQueue, bids, asks } = await deriveMarketAccounts(marketPubkey);

    console.log('  Base Vault (SKY0):', baseVault.toBase58());
    console.log('  Quote Vault (USDC):', quoteVault.toBase58());
    console.log('  Event Queue:', eventQueue.toBase58());
    console.log('  Bids:', bids.toBase58());
    console.log('  Asks:', asks.toBase58());
    console.log('');

    // Market parameters
    // Note: Phoenix only supports specific market size configurations
    // Valid configs: (512,512,128), (1024,1024,128), (2048,2048,128), (4096,4096,128)
    // Using (512, 512, 128) - requires ~2.79 SOL for rent
    // 
    // Important constraint: tick_size_in_quote_lots_per_base_unit % num_base_lots_per_base_unit == 0
    // Using: tick_size=1000, base_lots=1000, quote_lots=10000
    const marketParams: InitializeMarketParams = {
      tickSizeInQuoteLotsPerBaseUnit: BigInt(1000), // Must be multiple of base lots
      numBaseLotsPerBaseUnit: BigInt(1000),
      numQuoteLotsPerQuoteUnit: BigInt(10000),
      takerFeeBps: 25, // 0.25%
      marketSizeParams: {
        bidsSize: BigInt(512), // 512 orders per side
        asksSize: BigInt(512),
        numSeats: BigInt(128), // 128 traders
      },
    };

    console.log('📋 Market Parameters:');
    console.log('  Tick Size:', marketParams.tickSizeInQuoteLotsPerBaseUnit.toString());
    console.log('  Base Lots per Unit:', marketParams.numBaseLotsPerBaseUnit.toString());
    console.log('  Quote Lots per Unit:', marketParams.numQuoteLotsPerQuoteUnit.toString());
    console.log('  Taker Fee:', marketParams.takerFeeBps, 'bps (0.25%)');
    console.log('  Orders per Side:', marketParams.marketSizeParams.bidsSize.toString());
    console.log('  Max Traders:', marketParams.marketSizeParams.numSeats.toString());
    console.log('');

    // Serialize instruction data
    // Phoenix format: [discriminator (u8), ...borsh_serialized_params]
    const paramsData = serializeInitializeMarket(marketParams);
    const instructionData = Buffer.concat([Buffer.from([100]), paramsData]);

    // Phoenix log authority (static PDA)
    const LOG_AUTHORITY = new PublicKey('7aDTsspkQNGKmrexAN7FLx9oxU3iPczSSvHNggyuqYkR');

    console.log('  Log Authority:', LOG_AUTHORITY.toBase58());
    console.log('');

    // Build account list for InitializeMarket instruction
    // Exact order from Phoenix source code:
    // #[account(0, name = "phoenix_program")]
    // #[account(1, name = "log_authority")]
    // #[account(2, writable, name = "market")]
    // #[account(3, writable, signer, name = "market_creator")]
    // #[account(4, name = "base_mint")]
    // #[account(5, name = "quote_mint")]
    // #[account(6, writable, name = "base_vault")]
    // #[account(7, writable, name = "quote_vault")]
    // #[account(8, name = "system_program")]
    // #[account(9, name = "token_program")]
    const keys = [
      { pubkey: PHOENIX_PROGRAM_ID, isSigner: false, isWritable: false }, // 0: Phoenix program
      { pubkey: LOG_AUTHORITY, isSigner: false, isWritable: false }, // 1: Log authority
      { pubkey: marketPubkey, isSigner: false, isWritable: true }, // 2: Market
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true }, // 3: Market creator (signer)
      { pubkey: BASE_TOKEN_MINT, isSigner: false, isWritable: false }, // 4: Base mint
      { pubkey: QUOTE_TOKEN_MINT, isSigner: false, isWritable: false }, // 5: Quote mint
      { pubkey: baseVault, isSigner: false, isWritable: true }, // 6: Base vault
      { pubkey: quoteVault, isSigner: false, isWritable: true }, // 7: Quote vault
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // 8: System program
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // 9: Token program
    ];

    // Create instruction
    const instruction = new TransactionInstruction({
      keys,
      programId: PHOENIX_PROGRAM_ID,
      data: instructionData,
    });

    // Calculate market size (MarketHeader + market data)
    // For (512, 512, 128): approximately 400KB
    const MARKET_HEADER_SIZE = 368; // size_of::<MarketHeader>()
    const MARKET_DATA_SIZE = 400_000; // Approximate for (512, 512, 128)
    const MARKET_SIZE = MARKET_HEADER_SIZE + MARKET_DATA_SIZE;

    // Get rent exemption
    const rentExemption = await connection.getMinimumBalanceForRentExemption(MARKET_SIZE);

    console.log('💰 Market account rent:', rentExemption / 1e9, 'SOL');
    console.log('📏 Market account size:', MARKET_SIZE, 'bytes');
    console.log('');

    // Create market account instruction
    const createMarketAccountIx = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: marketPubkey,
      lamports: rentExemption,
      space: MARKET_SIZE,
      programId: PHOENIX_PROGRAM_ID,
    });

    // Build and send transaction
    console.log('📤 Building transaction...');
    const transaction = new Transaction()
      .add(createMarketAccountIx)
      .add(instruction);
    transaction.feePayer = wallet.publicKey;

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    console.log('✍️  Signing and sending transaction...');
    console.log('⏳ This may take a moment...');
    console.log('');

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet, marketKeypair], // Market keypair must sign!
      {
        commitment: 'confirmed',
        maxRetries: 3,
      }
    );

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Market created successfully!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Market Address:', marketPubkey.toBase58());
    console.log('Tx Signature:', signature);
    console.log('');
    console.log('🔗 View on Solana Explorer:');
    console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log('');
    console.log('📝 Market Details:');
    console.log('  Base Token: SKY0 (', BASE_TOKEN_MINT.toBase58(), ')');
    console.log('  Quote Token: USDC (', QUOTE_TOKEN_MINT.toBase58(), ')');
    console.log('  Fee Collector:', FEE_COLLECTOR.toBase58());
    console.log('');
    console.log('🎫 Phoenix Seats:');
    console.log('  Seats are automatically assigned to traders interacting with this market.');
    console.log('  Max seats:', marketParams.marketSizeParams.numSeats.toString());
    console.log('');

    return {
      marketAddress: marketPubkey.toBase58(),
      signature,
      baseVault: baseVault.toBase58(),
      quoteVault: quoteVault.toBase58(),
    };
  } catch (error: any) {
    console.error('❌ Error creating market:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    process.exit(1);
  }
}

main();
