# Building a Custom Trading UI for Your Market

Since the Phoenix web app doesn't show custom markets, here's how to build your own simple trading interface.

## Quick Web UI (HTML + JavaScript)

Create a simple `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>SKY0/USDC Trading</title>
  <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
</head>
<body>
  <h1>SKY0/USDC Market</h1>
  
  <div id="orderbook">
    <h2>Order Book</h2>
    <div id="asks"></div>
    <div id="bids"></div>
  </div>
  
  <div id="trading">
    <h2>Place Order</h2>
    <select id="side">
      <option value="buy">Buy</option>
      <option value="sell">Sell</option>
    </select>
    <input type="number" id="price" placeholder="Price (USDC)">
    <input type="number" id="amount" placeholder="Amount (SKY0)">
    <button onclick="placeOrder()">Place Order</button>
  </div>

  <script>
    const MARKET_ADDRESS = 'xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru';
    
    async function loadOrderBook() {
      // Use Phoenix SDK to fetch order book
      // Display in the UI
    }
    
    async function placeOrder() {
      const side = document.getElementById('side').value;
      const price = document.getElementById('price').value;
      const amount = document.getElementById('amount').value;
      
      // Call your backend API or use Phantom wallet
      alert(`Placing ${side} order: ${amount} SKY0 @ ${price} USDC`);
    }
    
    // Refresh order book every 5 seconds
    setInterval(loadOrderBook, 5000);
    loadOrderBook();
  </script>
</body>
</html>
```

## React Trading UI

For a more professional interface:

```bash
npx create-react-app sky0-trading
cd sky0-trading
npm install @solana/web3.js @solana/wallet-adapter-react @ellipsis-labs/phoenix-sdk
```

Then create components for:
- Order book display
- Order placement form
- Balance display
- Order history

## Option 4: Request Phoenix to List Your Market

Contact the Phoenix team:
- Discord: https://discord.gg/phoenix
- Ask them to add your market to their registry
- Provide your market address: `xb1VHaRPjH7tr1zVhqm4xi8fpA8B8VM6dtnuFLEGmru`

They may add it if:
- The tokens are legitimate
- There's sufficient liquidity
- It meets their listing criteria

## Option 5: Use Solana Wallet Adapters

Build a simple Next.js app with wallet connection:

```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { Client } from '@ellipsis-labs/phoenix-sdk';

function TradingInterface() {
  const { publicKey, signTransaction } = useWallet();
  
  const placeOrder = async (side, price, amount) => {
    const client = await Client.createWithoutConfig(connection, [marketPubkey]);
    // Place order logic
  };
  
  return (
    <div>
      <OrderBook marketAddress={MARKET_ADDRESS} />
      <OrderForm onSubmit={placeOrder} />
    </div>
  );
}
```

## Recommended Approach

**For now, use our scripts:**
```bash
npm run trade buy 0.15 100
npm run view-market
```

**Later, build a custom UI if needed.**

The market works perfectly - you just need a frontend to interact with it!
