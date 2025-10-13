# Phoenix DEX Market Creation Guide

## Summary

After extensive investigation, Phoenix DEX market creation on devnet appears to be **restricted** or requires specific authority that isn't publicly documented in the SDK.

## What We've Built

✅ **Working Scripts:**
1. `init.ts` - Wallet initialization and RPC connection
2. `setupVaults.ts` - Vault PDA derivation and verification
3. `config.ts` - Centralized configuration

## The Challenge

The Phoenix SDK (`@ellipsis-labs/phoenix-sdk`) **does not expose** a market creation function. Analysis shows:

- ❌ No `createMarket` or `initializeMarket` function in the SDK
- ❌ Manual instruction construction fails with "incorrect program id" error
- ❌ The error occurs at `src/program/validation/checkers/mod.rs:55:9` in the Phoenix program
- ❌ This suggests the program is checking account ownership/authority

## Error Analysis

```
Program log: Incorrect program id.
src/program/validation/checkers/mod.rs:55:9
```

This error indicates Phoenix is validating that one of the accounts has a specific program owner, likely:
- Market creation requires a specific authority
- Or market creation is restricted on devnet
- Or there's a missing account in the instruction

## Recommended Solutions

### Option 1: Use Phoenix Web Interface (EASIEST) ⭐
Visit: https://app.phoenix.trade
- Connect your wallet
- Navigate to "Create Market"
- Fill in your parameters:
  - Base Token: `4fVm6TbqF9SUhVxWr2S49UkNTwUgBjQPQG95K9oeKSKY` (SKY0)
  - Quote Token: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC)
  - Tick Size: 100
  - Base Lots: 1000
  - Quote Lots: 10000
  - Taker Fee: 25 bps
  - Orders per Side: 128
  - Max Traders: 256

### Option 2: Phoenix CLI
```bash
# Install Rust and Cargo first
cargo install phoenix-cli

# Create market
phoenix-cli create-market \
  --cluster devnet \
  --base-mint 4fVm6TbqF9SUhVxWr2S49UkNTwUgBjQPQG95K9oeKSKY \
  --quote-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --tick-size-in-quote-lots-per-base-unit 100 \
  --num-base-lots-per-base-unit 1000 \
  --num-quote-lots-per-quote-unit 10000 \
  --taker-fee-bps 25 \
  --fee-collector 6xX9G1jy4quapnew9CpHd1rz3pWKgysM2Q4MMBkmQMxN \
  --bids-size 128 \
  --asks-size 128 \
  --num-seats 256
```

### Option 3: Contact Phoenix Team
- Discord: https://discord.gg/phoenix
- Ask about programmatic market creation on devnet
- They may provide:
  - Authority requirements
  - Whitelist process
  - Additional documentation

### Option 4: Use Mainnet
Market creation might be less restricted on mainnet (but costs real SOL).

## What Works After Market Creation

Once your market is created (via web/CLI), you can use our scripts to:

```typescript
import { Client } from '@ellipsis-labs/phoenix-sdk';

// Connect to your market
const client = await Client.create(connection);
await client.addMarket('YOUR_MARKET_ADDRESS');

// Place orders
const orderIx = client.createPlaceLimitOrderInstruction(orderPacket, trader);

// Cancel orders
const cancelIx = client.createCancelAllOrdersInstruction(market, trader);

// Swap
const swapIx = client.createSwapInstruction(swapParams, trader);
```

## Market Parameters for SKY0/USDC

```javascript
{
  baseToken: '4fVm6TbqF9SUhVxWr2S49UkNTwUgBjQPQG95K9oeKSKY', // SKY0
  quoteToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  tickSize: 100,
  baseLotsPerUnit: 1000,
  quoteLotsPerUnit: 10000,
  takerFeeBps: 25, // 0.25%
  ordersPerSide: 128,
  maxTraders: 256,
  feeCollector: '6xX9G1jy4quapnew9CpHd1rz3pWKgysM2Q4MMBkmQMxN'
}
```

## Derived Addresses

```
Market: FGyrjWYDE3hU964qXZVrc5QP8mHsNmNyBysHbSenYwro
Base Vault: HBtW2sVco76EAsvH2bGZdpJJrXUuBy46diGSwEmF6Fw6
Quote Vault: XoJ6egijgmgixd46U8nhLoWJTL3MCNsGts21DhWaQ2X
Seat Manager: 9vQ66H6gW5uX1f8S5qjdUbKQnVWPSoA9oXXKMHTQ3ejL
```

## Next Steps

1. Create your market using the Phoenix web interface or CLI
2. Get the market address
3. Use the Phoenix SDK to interact with your market
4. Implement trading bots, market makers, or other integrations

## Additional Resources

- Phoenix Docs: https://docs.phoenix.trade
- Phoenix GitHub: https://github.com/Ellipsis-Labs/phoenix-v1
- Phoenix SDK: https://www.npmjs.com/package/@ellipsis-labs/phoenix-sdk
- Solana Devnet Faucet: https://faucet.solana.com
