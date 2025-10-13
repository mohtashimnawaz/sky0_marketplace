# Quick Start Guide

You've successfully created the SKY0 token and your own USDC token! Now you need to create a new market with your USDC mint.

## Current Status

✅ SKY0 Token Created: `Aw2iBfFyu62oLstr5xhJkcHoJBSZc8iN8sRMkw9rXnaz`
✅ Your USDC Created: `F7VFR1GFUTNAqdPkyCWJvKMV6zrSFW5wjWFGj22Rfas1`
✅ Config Updated

## Next Steps

### 1. Create New Market (with your USDC)

```bash
npm run create-market
```

This will create a new SKY0/USDC market using YOUR USDC token (where you control the mint authority).

### 2. Mint USDC to Your Account

```bash
npm run mint-usdc
```

This will mint 10,000 USDC to your account.

### 3. Bootstrap Liquidity

```bash
npm run bootstrap-liquidity
```

This will:
- Request a seat on the market
- Deposit SKY0 and USDC
- Place buy and sell orders

## Important Notes

- The first market you created used the official USDC devnet address (which you don't control)
- You need to create a NEW market with YOUR USDC token
- Update the `MARKET_ADDRESS` in `src/bootstrapLiquidity.ts` after creating the new market

## Token Balances

- SKY0: 1,000,000 tokens
- USDC: Will have 10,000 after minting

## Market Parameters

- Tick Size: 1000
- Base Lots: 1000
- Quote Lots: 10000
- Taker Fee: 0.25%
- Orders per Side: 512
- Max Traders: 128
