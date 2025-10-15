import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import { Client, Side, getLimitOrderPacket } from '@ellipsis-labs/phoenix-sdk';
import { RPC_URL, BASE_TOKEN_MINT, QUOTE_TOKEN_MINT } from './config';

dotenv.config();

const MARKET_ADDRESS = 'xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru';

async function main() {
  try {
    console.log('🔄 Trading on SKY0/USDC Market\n');
    console.log('═══════════════════════════════════════════════════════════');

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
    
    const marketState = client.marketStates.get(MARKET_ADDRESS);
    if (!marketState) {
      throw new Error('Market state not found');
    }

    console.log('✅ Connected to market');
    console.log('');

    // Check token balances
    console.log('💰 Checking balances...');
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

    const sky0Balance = Number(baseTokenAccount.amount) / 1e9;
    const usdcBalance = Number(quoteTokenAccount.amount) / 1e6;

    console.log('  SKY0:', sky0Balance);
    console.log('  USDC:', usdcBalance);
    console.log('');

    // Show current order book
    console.log('📖 Current Order Book:');
    const ladder = client.getUiLadder(MARKET_ADDRESS, 5);
    
    console.log('\n📊 Asks (Sell Orders):');
    if (ladder.asks.length === 0) {
      console.log('  (empty)');
    } else {
      ladder.asks.reverse().forEach((level) => {
        console.log(`  ${level.quantity.toFixed(2)} SKY0 @ ${level.price.toFixed(4)} USDC`);
      });
    }
    
    console.log('\n📊 Bids (Buy Orders):');
    if (ladder.bids.length === 0) {
      console.log('  (empty)');
    } else {
      ladder.bids.forEach((level) => {
        console.log(`  ${level.quantity.toFixed(2)} SKY0 @ ${level.price.toFixed(4)} USDC`);
      });
    }
    console.log('');

    // Trading menu
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 TRADING OPTIONS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Choose an action:');
    console.log('  1. Place a BUY order (buy SKY0 with USDC)');
    console.log('  2. Place a SELL order (sell SKY0 for USDC)');
    console.log('  3. Execute a SWAP (market order)');
    console.log('  4. Cancel all orders');
    console.log('  5. View my open orders');
    console.log('');

    // For demo, let's place a buy order
    // You can modify this to accept user input
    const action = process.argv[2] || 'buy';
    const price = parseFloat(process.argv[3] || '0.15');
    const size = parseFloat(process.argv[4] || '100');

    if (action === 'buy') {
      console.log(`📈 Placing BUY order: ${size} SKY0 @ ${price} USDC`);
      console.log('');

      // Convert to ticks and lots
      const priceInTicks = client.floatPriceToTicks(price, MARKET_ADDRESS);
      const numBaseLots = client.rawBaseUnitsToBaseLotsRoundedDown(size, MARKET_ADDRESS);

      const orderPacket = getLimitOrderPacket({
        side: Side.Bid,
        priceInTicks: priceInTicks,
        numBaseLots: Number(numBaseLots),
        clientOrderId: Date.now(),
        useOnlyDepositedFunds: true,
      });

      const orderIx = marketState.createPlaceLimitOrderWithFreeFundsInstruction(
        orderPacket,
        wallet.publicKey
      );

      const tx = new Transaction().add(orderIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [wallet], {
        commitment: 'confirmed',
      });

      console.log('✅ Order placed!');
      console.log('   Tx:', sig);
      console.log(`   https://explorer.solana.com/tx/${sig}?cluster=devnet`);

    } else if (action === 'sell') {
      console.log(`📉 Placing SELL order: ${size} SKY0 @ ${price} USDC`);
      console.log('');

      const priceInTicks = client.floatPriceToTicks(price, MARKET_ADDRESS);
      const numBaseLots = client.rawBaseUnitsToBaseLotsRoundedDown(size, MARKET_ADDRESS);

      const orderPacket = getLimitOrderPacket({
        side: Side.Ask,
        priceInTicks: priceInTicks,
        numBaseLots: Number(numBaseLots),
        clientOrderId: Date.now(),
        useOnlyDepositedFunds: true,
      });

      const orderIx = marketState.createPlaceLimitOrderWithFreeFundsInstruction(
        orderPacket,
        wallet.publicKey
      );

      const tx = new Transaction().add(orderIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [wallet], {
        commitment: 'confirmed',
      });

      console.log('✅ Order placed!');
      console.log('   Tx:', sig);
      console.log(`   https://explorer.solana.com/tx/${sig}?cluster=devnet`);

    } else if (action === 'cancel') {
      console.log('🚫 Cancelling all orders...');
      
      const cancelIx = marketState.createCancelAllOrdersWithFreeFundsInstruction(
        wallet.publicKey
      );

      const tx = new Transaction().add(cancelIx);
      const sig = await sendAndConfirmTransaction(connection, tx, [wallet], {
        commitment: 'confirmed',
      });

      console.log('✅ All orders cancelled!');
      console.log('   Tx:', sig);

    } else if (action === 'view') {
      console.log('📋 Your open orders:');
      // The SDK provides methods to get open orders
      // This requires parsing the market state
      console.log('   (Use Phoenix CLI: phoenix-cli get-open-orders', MARKET_ADDRESS, wallet.publicKey.toBase58(), '--url devnet)');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Trading complete!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error: any) {
    console.error('❌ Error:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    process.exit(1);
  }
}

main();
