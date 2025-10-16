# Phoenix Market Creation Rent Analysis - Quick Summary

## The Question
Why does `phoenix-sdk` cost 11.9 SOL while `dexmarket` costs only 2.7 SOL for market creation?

## The Answer
**It's intentional and correct** — they use different market configurations:

| Folder | Configuration | Account Size | Rent Cost | Use Case |
|--------|--------------|--------------|-----------|----------|
| **dexmarket** | 512×512×128 | ~400 KB | **2.79 SOL** | Small/test markets |
| **phoenix-sdk** | 1024×1024×128 | ~1.64 MB | **11.99 SOL** | Production markets |

**Difference: 9.2 SOL** (4.3x more expensive)

## Verified on Devnet (October 16, 2025)

```
Dexmarket (512×512×128):
  Account Size:  400,368 bytes
  Rent Required: 2.7875 SOL

Phoenix-SDK Standard (1024×1024×128):
  Account Size:  1,723,488 bytes
  Rent Required: 11.9964 SOL
```

## Why the Difference?

**Market capacity:**
- Dexmarket: 512 orders per side (buy/sell)
- Phoenix-SDK: 1024 orders per side (buy/sell)

**Account size growth is non-linear:**
- Doubling order capacity → 4.3x larger account
- Phoenix stores all order book data in the market account

## Will It Matter on Mainnet?

### YES - Choose Wisely

**⚠️ Important Constraints:**
- Phoenix protocol may **require** minimum 1024×1024 config on mainnet
- Several SDK files state: "Valid configs MUST have bidsSize/asksSize >= 1024"
- All observed mainnet markets use 1,723,488 bytes (1024×1024 config)

### Recommendation for Mainnet: Use Phoenix-SDK Standard (1024×1024×128)

**Why:**
✅ Proven configuration (used by existing markets)  
✅ Compatible with Phoenix tooling & Seat Manager  
✅ Handles higher trading volumes  
✅ Lower risk of protocol rejection  

**Cost:**
- 11.99 SOL rent deposit (recoverable if you close the market)
- Plus ~0.05 SOL transaction fees (not recoverable)
- Total: ~12 SOL needed

**Alternative (Higher Risk):**
- Contact Phoenix Labs first to confirm if 512×512 is allowed
- Could save 9 SOL, but may be rejected on mainnet
- Limited order book capacity

## Key Takeaways

1. **The rent is recoverable** - It's a refundable deposit, not a fee
2. **Use phoenix-sdk standard config** for mainnet (safer)
3. **Test on devnet first** with exact parameters
4. **Contact Phoenix Labs** before mainnet deployment
5. **Budget ~15 SOL** (12 rent + 3 buffer) for mainnet

## Files Created

- ✅ `MARKET_RENT_ANALYSIS.md` - Full detailed report (21 pages)
- ✅ `verify-rent-costs.ts` - Verification script you can run
- ✅ `QUICK_SUMMARY.md` - This summary (1 page)

## Quick Verification

Run this to check rent costs yourself:

```bash
# Compile and run the verification script
npx tsc verify-rent-costs.ts --module commonjs --target es2020 --esModuleInterop --skipLibCheck
node verify-rent-costs.js devnet
```

Or check existing scripts:

```bash
# Phoenix-SDK preflight (shows 1024×1024 config rent)
cd phoenix-sdk/market-creation
npx ts-node preflight-check.ts devnet

# Dexmarket (shows 512×512 config rent)
cd dexmarket
npx ts-node src/createMarket.ts
```

## Next Steps

1. ✅ Review full report: `MARKET_RENT_ANALYSIS.md`
2. ⚠️ Contact Phoenix Labs for mainnet guidance
3. 🧪 Test on devnet with your chosen configuration
4. 💰 Fund wallet with ~15 SOL before mainnet deployment
5. 🚀 Deploy using `phoenix-sdk/market-creation/create-market-mainnet.ts`

---

**Bottom Line:** Use the Phoenix-SDK standard configuration (1024×1024×128) for mainnet. The extra 9 SOL is for higher capacity and compatibility. It's recoverable if you close the market later.

📖 **Full Analysis:** See `MARKET_RENT_ANALYSIS.md` for complete details, code references, and risk assessment.
