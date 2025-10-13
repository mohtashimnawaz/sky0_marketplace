# Phoenix CLI Commands for Your Market

Your market address: `xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru`

## 📊 View Market Information

### Get Full Market Details
```bash
phoenix-cli get-market xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

**Output:**
```
Market Address: xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru
Status: Active
Authority: 6xX9G1jy4quapnew9CpHd1rz3pWKgysM2Q4MMBkmQMxN
Base Vault balance: 1000.000 SKY0
Quote Vault balance: 200.000 USDC
Base Token: Aw2iBfFyu62oLstr5xhJkcHoJBSZc8iN8sRMkw9rXnaz
Quote Token: F7VFR1GFUTNAqdPkyCWJvKMV6zrSFW5wjWFGj22Rfas1
Tick size: 0.1 USDC per SKY0
Taker fees: 25 bps (0.25%)
Market Size: 512 orders per side, 128 traders
```

### Get Market Status
```bash
phoenix-cli get-market-status xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

**Output:** `Market status: Active`

### Get Order Book (Top of Book)
```bash
phoenix-cli get-top-of-book xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

**Output:**
```
             0.2  500.000    <- Ask: 500 SKY0 @ 0.20 USDC
 500.000     0.1             <- Bid: 500 SKY0 @ 0.10 USDC
```

### Get Full Order Book
```bash
phoenix-cli get-full-book xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

### Get Book Levels (First N levels)
```bash
phoenix-cli get-book-levels xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

## 👥 Trader Information

### Get Your Seat Info
```bash
phoenix-cli get-seat-info xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru 6xX9G1jy4quapnew9CpHd1rz3pWKgysM2Q4MMBkmQMxN --url devnet
```

### Get Your Open Orders
```bash
phoenix-cli get-open-orders xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru 6xX9G1jy4quapnew9CpHd1rz3pWKgysM2Q4MMBkmQMxN --url devnet
```

### Get All Active Traders
```bash
phoenix-cli get-traders-for-market xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

## 📈 Current Market State

**Status:** ✅ Active  
**Authority:** You (6xX9G1jy4quapnew9CpHd1rz3pWKgysM2Q4MMBkmQMxN)

**Liquidity:**
- Base Vault: 1000 SKY0
- Quote Vault: 200 USDC

**Order Book:**
- **Ask:** 500 SKY0 @ 0.20 USDC
- **Bid:** 500 SKY0 @ 0.10 USDC
- **Spread:** 0.10 USDC (100%)

**Market Parameters:**
- Tick Size: 0.1 USDC
- Taker Fee: 0.25%
- Orders per Side: 512
- Max Traders: 128

## 🔗 Links

**Solana Explorer:**
```
https://explorer.solana.com/address/xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru?cluster=devnet
```

**Base Token (SKY0):**
```
https://explorer.solana.com/address/Aw2iBfFyu62oLstr5xhJkcHoJBSZc8iN8sRMkw9rXnaz?cluster=devnet
```

**Quote Token (USDC):**
```
https://explorer.solana.com/address/F7VFR1GFUTNAqdPkyCWJvKMV6zrSFW5wjWFGj22Rfas1?cluster=devnet
```

## 🎯 Quick Reference

```bash
# View market
phoenix-cli get-market xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet

# View order book
phoenix-cli get-full-book xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet

# Check status
phoenix-cli get-market-status xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru --url devnet
```

## ✅ Verification

Your market is **fully operational** and can be viewed/managed using Phoenix CLI!

All commands work perfectly, confirming your market is:
- ✅ Created successfully
- ✅ Activated and live
- ✅ Has liquidity (1000 SKY0, 200 USDC)
- ✅ Has active orders (buy @ 0.10, sell @ 0.20)
- ✅ Ready for trading
