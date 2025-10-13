# Phoenix DEX - SKY0/USDC Market Setup

Node.js/TypeScript environment for creating and managing a SKY0/USDC market on Phoenix DEX.

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

1. Copy `.env` and add your wallet credentials:
```env
WALLET_SECRET_KEY=your_secret_key_here
WALLET_PUBLIC_KEY=your_public_key_here
```

2. Market parameters are configured in `src/config.ts`:
- Base Token (SKY0): `4fVm6TbqF9SUhVxWr2S49UkNTwUgBjQPQG95K9oeKSKY`
- Quote Token (USDC): `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- RPC: Solana Devnet
- Phoenix Program: `PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY`

## 🚀 Available Scripts

### Initialize & Check Connection
```bash
npm start
```
Connects to Solana devnet, loads your wallet, and displays balance.

### Setup Vaults
```bash
npm run setup-vaults
```
Derives and verifies vault PDAs for the SKY0/USDC market.

### Create Market (CLI Command Generator)
```bash
npm run create-market-cli
```
Generates the Phoenix CLI command to create your market.

### Check SDK Capabilities
```bash
npm run check-sdk
```
Explores Phoenix SDK features and available methods.

## 📋 Market Parameters

| Parameter | Value |
|-----------|-------|
| Tick Size | 100 |
| Base Lots per Unit | 1000 |
| Quote Lots per Unit | 10000 |
| Taker Fee | 25 bps (0.25%) |
| Orders per Side | 128 |
| Max Traders | 256 |

## 🔑 Derived Addresses

```
Market:       FGyrjWYDE3hU964qXZVrc5QP8mHsNmNyBysHbSenYwro
Base Vault:   HBtW2sVco76EAsvH2bGZdpJJrXUuBy46diGSwEmF6Fw6
Quote Vault:  XoJ6egijgmgixd46U8nhLoWJTL3MCNsGts21DhWaQ2X
Seat Manager: 9vQ66H6gW5uX1f8S5qjdUbKQnVWPSoA9oXXKMHTQ3ejL
```

## ✅ Market Creation Working!

We successfully reverse-engineered Phoenix market creation! See `SUCCESS.md` for details.

**Requirements:**
- ~3 SOL for market creation (get from https://faucet.solana.com)
- Run: `npm run create-market`

The script will:
1. Generate a market keypair
2. Create and initialize the market account
3. Set up all vaults and parameters
4. Return your market address

## 📁 Project Structure

```
├── src/
│   ├── config.ts              # Configuration and constants
│   ├── init.ts                # Wallet initialization
│   ├── setupVaults.ts         # Vault PDA derivation
│   ├── createMarket.ts        # Market creation attempt (educational)
│   ├── createMarketCLI.ts     # CLI command generator
│   └── createMarketSimple.ts  # SDK exploration
├── .env                       # Environment variables (create this)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── README.md                 # This file
└── MARKET_CREATION_GUIDE.md  # Detailed guide
```

## 🔗 Resources

- [Phoenix DEX](https://phoenix.trade)
- [Phoenix Docs](https://docs.phoenix.trade)
- [Phoenix SDK](https://www.npmjs.com/package/@ellipsis-labs/phoenix-sdk)
- [Solana Devnet Faucet](https://faucet.solana.com)

## 📝 License

ISC
