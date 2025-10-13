import { execSync } from 'child_process';
import dotenv from 'dotenv';
import {
  BASE_TOKEN_MINT,
  QUOTE_TOKEN_MINT,
  FEE_COLLECTOR,
} from './config';

dotenv.config();

async function main() {
  console.log('🚀 Creating SKY0/USDC Market using Phoenix CLI\n');
  console.log('═══════════════════════════════════════════════════════════');
  
  console.log('\n📋 Market Parameters:');
  console.log('  Base Token (SKY0):', BASE_TOKEN_MINT.toBase58());
  console.log('  Quote Token (USDC):', QUOTE_TOKEN_MINT.toBase58());
  console.log('  Fee Collector:', FEE_COLLECTOR.toBase58());
  console.log('  Tick Size: 100');
  console.log('  Base Lots per Unit: 1000');
  console.log('  Quote Lots per Unit: 10000');
  console.log('  Taker Fee: 25 bps (0.25%)');
  console.log('  Orders per Side: 128');
  console.log('  Max Traders: 256');
  console.log('');
  
  console.log('⚠️  Phoenix market creation requires the Phoenix CLI.');
  console.log('');
  console.log('Installation:');
  console.log('  cargo install phoenix-cli');
  console.log('');
  console.log('Or use the Phoenix web interface:');
  console.log('  https://app.phoenix.trade');
  console.log('');
  console.log('Command to create market (after installing CLI):');
  console.log('');
  console.log(`phoenix-cli create-market \\`);
  console.log(`  --cluster devnet \\`);
  console.log(`  --base-mint ${BASE_TOKEN_MINT.toBase58()} \\`);
  console.log(`  --quote-mint ${QUOTE_TOKEN_MINT.toBase58()} \\`);
  console.log(`  --tick-size-in-quote-lots-per-base-unit 100 \\`);
  console.log(`  --num-base-lots-per-base-unit 1000 \\`);
  console.log(`  --num-quote-lots-per-quote-unit 10000 \\`);
  console.log(`  --taker-fee-bps 25 \\`);
  console.log(`  --fee-collector ${FEE_COLLECTOR.toBase58()} \\`);
  console.log(`  --bids-size 128 \\`);
  console.log(`  --asks-size 128 \\`);
  console.log(`  --num-seats 256`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Alternative: Use the Phoenix web app at https://app.phoenix.trade');
  console.log('to create your market through a user-friendly interface.');
}

main();
