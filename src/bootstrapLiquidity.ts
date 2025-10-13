import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { Client, Side, getLimitOrderPacket } from '@ellipsis-labs/phoenix-sdk';
import { RPC_URL, BASE_TOKEN_MINT, QUOTE_TOKEN_MINT } from './config';

dotenv.config();

// Your market address from the creation (updated with YOUR USDC mint)
const MARKET_ADDRESS = 'xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru';

async function main() {
  try {
    console.log('💧 Bootstrapping Liquidity for SKY0/USDC Market\n');
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
    console.log('📊 Market:', MARKET_ADDRESS);
    console.log('');

    // Create Phoenix client
    console.log('🔌 Connecting to Phoenix...');
    const client = await Client.createWithoutConfig(connection, [new PublicKey(MARKET_ADDRESS)]);
    
    console.log('✅ Connected to Phoenix SDK');
    console.log('');

    // Get or create token accounts
    console.log('📦 Setting up token accounts...');
    const baseTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      BASE_TOKEN_MINT,
      wallet.publicKey
    );
    
    const quoteTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      QUOTE_TOKEN_MINT,
      wallet.publicKey
    );

    console.log('  Base Token Account (SKY0):', baseTokenAccount.address.toBase58());
    console.log('  Quote Token Account (USDC):', quoteTokenAccount.address.toBase58());
    console.log('');

    // Check balances
    console.log('💰 Token Balances:');
    const sky0Balance = Number(baseTokenAccount.amount) / 1e9;
    const usdcBalance = Number(quoteTokenAccount.amount) / 1e6;
    console.log('  SKY0:', sky0Balance);
    console.log('  USDC:', usdcBalance);
    
    if (sky0Balance < 1000) {
      console.log('⚠️  Insufficient SKY0 balance. Need at least 1000 SKY0.');
      console.log('   Run: npm run create-token');
      process.exit(1);
    }
    
    if (usdcBalance < 100) {
      console.log('⚠️  Insufficient USDC balance. Need at least 100 USDC.');
      console.log('   You need to get USDC devnet tokens or create your own.');
      console.log('   USDC Mint:', QUOTE_TOKEN_MINT.toBase58());
      process.exit(1);
    }
    console.log('');

    // Get market state
    const marketState = client.marketStates.get(MARKET_ADDRESS);
    if (!marketState) {
      throw new Error('Market state not found');
    }

    // Check if seat already exists
    const [seatAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('seat'), new PublicKey(MARKET_ADDRESS).toBuffer(), wallet.publicKey.toBuffer()],
      new PublicKey('PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY')
    );
    
    const seatInfo = await connection.getAccountInfo(seatAddress);
    if (!seatInfo) {
      console.log('🪑 Requesting seat on market...');
      const requestSeatIx = client.createRequestSeatInstruction(MARKET_ADDRESS, wallet.publicKey, wallet.publicKey);
      
      const seatTx = new Transaction().add(requestSeatIx);
      const seatSig = await sendAndConfirmTransaction(connection, seatTx, [wallet], {
        commitment: 'confirmed',
      });
      
      console.log('✅ Seat requested:', seatSig);
    } else {
      console.log('✅ Seat already exists and is approved!');
      console.log('   Seat:', seatAddress.toBase58());
    }
    console.log('');

    // Deposit funds to the market
    console.log('💵 Depositing funds to market...');
    
    // Convert to lots (Phoenix uses lots, not raw amounts)
    // For 1000 SKY0: convert to base lots
    const baseUnitsToDeposit = 1000; // 1000 SKY0
    const baseLotsToDeposit = client.rawBaseUnitsToBaseLotsRoundedDown(baseUnitsToDeposit, MARKET_ADDRESS);
    
    // For 200 USDC: convert to quote lots  
    const quoteUnitsToDeposit = 200; // 200 USDC
    const quoteLotsToDeposit = client.quoteUnitsToQuoteLots(quoteUnitsToDeposit, MARKET_ADDRESS);
    
    console.log('  Depositing:', baseUnitsToDeposit, 'SKY0 (', baseLotsToDeposit.toString(), 'lots )');
    console.log('  Depositing:', quoteUnitsToDeposit, 'USDC (', quoteLotsToDeposit.toString(), 'lots )');
    console.log('');
    
    const depositIx = marketState.createDepositFundsInstruction(
      {
        depositFundsParams: {
          quoteLotsToDeposit: quoteLotsToDeposit,
          baseLotsToDeposit: baseLotsToDeposit,
        },
      },
      wallet.publicKey
    );

    const depositTx = new Transaction().add(depositIx);
    const depositSig = await sendAndConfirmTransaction(connection, depositTx, [wallet], {
      commitment: 'confirmed',
    });

    console.log('✅ Funds deposited:', depositSig);
    console.log('  Deposited: 1000 SKY0, 200 USDC');
    console.log('');

    // Place buy order: 500 SKY0 @ 0.12 USDC
    console.log('📈 Placing buy order...');
    const buyPriceFloat = 0.12; // USDC per SKY0
    const buySize = 500; // SKY0
    
    // Convert price to ticks
    const buyPriceInTicks = client.floatPriceToTicks(buyPriceFloat, MARKET_ADDRESS);
    const buyNumBaseLots = client.rawBaseUnitsToBaseLotsRoundedDown(buySize, MARKET_ADDRESS);

    const buyOrderPacket = getLimitOrderPacket({
      side: Side.Bid,
      priceInTicks: buyPriceInTicks,
      numBaseLots: Number(buyNumBaseLots),
      clientOrderId: 1,
      useOnlyDepositedFunds: true,
    });

    const buyOrderIx = marketState.createPlaceLimitOrderWithFreeFundsInstruction(
      buyOrderPacket,
      wallet.publicKey
    );

    const buyTx = new Transaction().add(buyOrderIx);
    const buySig = await sendAndConfirmTransaction(connection, buyTx, [wallet], {
      commitment: 'confirmed',
    });

    console.log('✅ Buy order placed: 500 SKY0 @ 0.12 USDC');
    console.log('   Tx:', buySig);
    console.log('');

    // Place sell order: 500 SKY0 @ 0.18 USDC
    console.log('📉 Placing sell order...');
    const sellPriceFloat = 0.18; // USDC per SKY0
    const sellSize = 500; // SKY0
    
    // Convert price to ticks
    const sellPriceInTicks = client.floatPriceToTicks(sellPriceFloat, MARKET_ADDRESS);
    const sellNumBaseLots = client.rawBaseUnitsToBaseLotsRoundedDown(sellSize, MARKET_ADDRESS);

    const sellOrderPacket = getLimitOrderPacket({
      side: Side.Ask,
      priceInTicks: sellPriceInTicks,
      numBaseLots: Number(sellNumBaseLots),
      clientOrderId: 2,
      useOnlyDepositedFunds: true,
    });

    const sellOrderIx = marketState.createPlaceLimitOrderWithFreeFundsInstruction(
      sellOrderPacket,
      wallet.publicKey
    );

    const sellTx = new Transaction().add(sellOrderIx);
    const sellSig = await sendAndConfirmTransaction(connection, sellTx, [wallet], {
      commitment: 'confirmed',
    });

    console.log('✅ Sell order placed: 500 SKY0 @ 0.18 USDC');
    console.log('   Tx:', sellSig);
    console.log('');

    // Refresh market state
    await client.refreshMarket(MARKET_ADDRESS);
    const updatedMarketState = client.marketStates.get(MARKET_ADDRESS);
    if (!updatedMarketState) {
      throw new Error('Failed to refresh market state');
    }

    // Get order book
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📖 Current Order Book');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    const ladder = client.getUiLadder(MARKET_ADDRESS, 10);
    
    console.log('📊 Asks (Sell Orders):');
    if (ladder.asks.length === 0) {
      console.log('  (empty)');
    } else {
      ladder.asks.reverse().forEach((level) => {
        console.log(`  ${level.quantity.toFixed(2)} SKY0 @ ${level.price.toFixed(4)} USDC`);
      });
    }
    
    console.log('');
    console.log('  ─────────── SPREAD ───────────');
    console.log('');
    
    console.log('📊 Bids (Buy Orders):');
    if (ladder.bids.length === 0) {
      console.log('  (empty)');
    } else {
      ladder.bids.forEach((level) => {
        console.log(`  ${level.quantity.toFixed(2)} SKY0 @ ${level.price.toFixed(4)} USDC`);
      });
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Liquidity Bootstrap Complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Market is now live with initial liquidity:');
    console.log('  • Buy side: 500 SKY0 @ 0.12 USDC');
    console.log('  • Sell side: 500 SKY0 @ 0.18 USDC');
    console.log('  • Spread: 0.06 USDC (50%)');
    console.log('');
    console.log('🔗 View market on Phoenix:');
    console.log(`https://app.phoenix.trade/market/${MARKET_ADDRESS}?cluster=devnet`);

  } catch (error: any) {
    console.error('❌ Error:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    process.exit(1);
  }
}

main();
