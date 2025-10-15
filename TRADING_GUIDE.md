# 🔄 Trading Guide - SKY0/USDC Market

Your market is live! Here's how to trade on it.

---

## Quick Start

### View Market
```bash
npm run view-market
```

### Place a Buy Order
```bash
npm run trade buy 0.15 100
```
Buys 100 SKY0 at 0.15 USDC each

### Place a Sell Order
```bash
npm run trade sell 0.25 100
```
Sells 100 SKY0 at 0.25 USDC each

### Cancel All Orders
```bash
npm run trade cancel
```

---

## Trading Commands

### 1. Place Limit Orders

**Buy Order (Bid):**
```bash
npm run trade buy <price> <amount>
```

Example:
```bash
npm run trade buy 0.15 100
# Buys 100 SKY0 at 0.15 USDC each
```

**Sell Order (Ask):**
```bash
npm run trade sell <price> <amount>
```

Example:
```bash
npm run trade sell 0.25 50
# Sells 50 SKY0 at 0.25 USDC each
```

### 2. View Your Orders

**Using Phoenix CLI:**
```bash
phoenix-cli get-open-orders xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru YOUR_WALLET_ADDRESS --url devnet
```

### 3. Cancel Orders

**Cancel All:**
```bash
npm run trade cancel
```

**Cancel Specific (via Phoenix CLI):**
```bash
phoenix-cli cancel-order <order_id> --market xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

---

## Current Market State

**Order Book:**
- **Ask:** 500 SKY0 @ 0.20 USDC
- **Bid:** 500 SKY0 @ 0.10 USDC
- **Spread:** 0.10 USDC (100%)

**Liquidity:**
- Base Vault: 1000 SKY0
- Quote Vault: 200 USDC

---

## Trading Examples

### Example 1: Buy at Market Price
Place a buy order at or above the current ask (0.20 USDC):
```bash
npm run trade buy 0.20 10
```
This will match immediately with the existing sell order.

### Example 2: Sell at Market Price
Place a sell order at or below the current bid (0.10 USDC):
```bash
npm run trade sell 0.10 10
```
This will match immediately with the existing buy order.

### Example 3: Place Limit Order
Place a buy order below market:
```bash
npm run trade buy 0.15 50
```
This order will sit in the order book until someone sells at 0.15 or lower.

### Example 4: Provide Liquidity
Add orders on both sides:
```bash
# Add buy order
npm run trade buy 0.14 100

# Add sell order
npm run trade sell 0.16 100
```

---

## Before Trading

### 1. Check Your Balances
```bash
npm run view-market
```

Shows:
- Your SKY0 balance
- Your USDC balance
- Current order book

### 2. Ensure You Have Tokens

**Need more SKY0?**
```bash
npm run create-token
```

**Need more USDC?**
```bash
npm run mint-usdc
```

### 3. Deposit Funds to Market

If you haven't deposited yet:
```bash
npm run bootstrap-liquidity
```

Or create a custom deposit script.

---

## Advanced Trading

### Using Phoenix SDK Directly

```typescript
import { Client, Side, getLimitOrderPacket } from '@ellipsis-labs/phoenix-sdk';

const client = await Client.createWithoutConfig(connection, [marketPubkey]);
const marketState = client.marketStates.get(MARKET_ADDRESS);

// Place limit order
const priceInTicks = client.floatPriceToTicks(0.15, MARKET_ADDRESS);
const numBaseLots = client.rawBaseUnitsToBaseLotsRoundedDown(100, MARKET_ADDRESS);

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

// Send transaction
const tx = new Transaction().add(orderIx);
const sig = await sendAndConfirmTransaction(connection, tx, [wallet]);
```

### Market Orders (Swaps)

```typescript
// Execute a swap (market order)
const swapIx = marketState.createSwapInstruction(
  {
    side: Side.Bid, // Buy
    inAmount: 10_000_000, // 10 USDC (6 decimals)
    minOutAmount: 0,
  },
  wallet.publicKey
);
```

---

## Phoenix CLI Trading Commands

### View Order Book
```bash
phoenix-cli get-full-book xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

### View Top of Book
```bash
phoenix-cli get-top-of-book xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

### View Your Open Orders
```bash
phoenix-cli get-open-orders xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru YOUR_WALLET --url devnet
```

### View Market Status
```bash
phoenix-cli get-market-status xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

---

## Trading Fees

**Taker Fee:** 0.25% (25 bps)
- Charged when your order matches immediately
- Paid in quote currency (USDC)

**Maker Fee:** 0% (no fee)
- When your order sits in the book and gets filled

**Fee Collector:** Your wallet (6xX9G1jy4quapnew9CpHd1rz3pWKgysM2Q4MMBkmQMxN)

---

## Troubleshooting

### "Insufficient funds" error
- Deposit more tokens to the market
- Check your token balances

### "Seat not approved" error
- Run: `npm run activate-market`

### "Invalid price" error
- Price must be a multiple of tick size (0.1 USDC)
- Valid prices: 0.1, 0.2, 0.3, etc.

### "Order too small" error
- Minimum order size depends on lot sizes
- Try larger amounts

---

## Market Parameters

- **Tick Size:** 0.1 USDC
- **Base Lot Size:** 0.001 SKY0
- **Quote Lot Size:** 0.0001 USDC
- **Min Order Size:** ~1 SKY0
- **Taker Fee:** 0.25%

---

## Resources

**Market Address:**
```
xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru
```

**Explorer:**
```
https://explorer.solana.com/address/xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru?cluster=devnet
```

**Phoenix SDK Docs:**
```
https://www.npmjs.com/package/@ellipsis-labs/phoenix-sdk
```

---

## Happy Trading! 🚀

Your market is live and ready for trading. Start with small orders to test, then scale up!
