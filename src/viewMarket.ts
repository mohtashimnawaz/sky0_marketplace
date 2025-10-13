import { Connection, PublicKey } from '@solana/web3.js';
import { Client } from '@ellipsis-labs/phoenix-sdk';
import { RPC_URL } from './config';

const MARKET_ADDRESS = 'xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru';

async function main() {
  try {
    console.log('📊 SKY0/USDC Market Viewer\n');
    console.log('═══════════════════════════════════════════════════════════');

    const connection = new Connection(RPC_URL, 'confirmed');

    // Create Phoenix client with your market
    console.log('🔌 Connecting to market...');
    const client = await Client.createWithoutConfig(connection, [new PublicKey(MARKET_ADDRESS)]);

    console.log('✅ Connected!\n');

    // Get market state
    const marketState = client.marketStates.get(MARKET_ADDRESS);
    if (!marketState) {
      throw new Error('Market state not found');
    }

    // Display market info
    console.log('📋 Market Information:');
    console.log('  Address:', MARKET_ADDRESS);
    console.log('  Base Token: SKY0');
    console.log('  Quote Token: USDC');
    console.log('');

    // Get order book
    console.log('📖 Order Book:');
    console.log('═══════════════════════════════════════════════════════════');
    
    const ladder = client.getUiLadder(MARKET_ADDRESS, 20);
    
    console.log('\n📊 Asks (Sell Orders):');
    if (ladder.asks.length === 0) {
      console.log('  (empty)');
    } else {
      ladder.asks.reverse().forEach((level, idx) => {
        console.log(`  ${idx + 1}. ${level.quantity.toFixed(2)} SKY0 @ ${level.price.toFixed(4)} USDC`);
      });
    }
    
    console.log('\n  ─────────── SPREAD ───────────');
    
    if (ladder.asks.length > 0 && ladder.bids.length > 0) {
      const bestAsk = ladder.asks[0].price;
      const bestBid = ladder.bids[0].price;
      const spread = bestAsk - bestBid;
      const spreadPercent = ((spread / bestBid) * 100).toFixed(2);
      console.log(`  Spread: ${spread.toFixed(4)} USDC (${spreadPercent}%)`);
    }
    
    console.log('  ─────────── SPREAD ───────────\n');
    
    console.log('📊 Bids (Buy Orders):');
    if (ladder.bids.length === 0) {
      console.log('  (empty)');
    } else {
      ladder.bids.forEach((level, idx) => {
        console.log(`  ${idx + 1}. ${level.quantity.toFixed(2)} SKY0 @ ${level.price.toFixed(4)} USDC`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Market is live and operational!');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Market stats
    console.log('📈 Market Stats:');
    console.log('  Total Ask Liquidity:', ladder.asks.reduce((sum, l) => sum + l.quantity, 0).toFixed(2), 'SKY0');
    console.log('  Total Bid Liquidity:', ladder.bids.reduce((sum, l) => sum + l.quantity, 0).toFixed(2), 'SKY0');
    
    if (ladder.bids.length > 0) {
      const totalBidValue = ladder.bids.reduce((sum, l) => sum + (l.quantity * l.price), 0);
      console.log('  Total Bid Value:', totalBidValue.toFixed(2), 'USDC');
    }
    
    console.log('');
    console.log('🔗 View on Solana Explorer:');
    console.log(`https://explorer.solana.com/address/${MARKET_ADDRESS}?cluster=devnet`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
