import crypto from 'crypto';

// Phoenix might use different discriminator schemes
// Let's calculate possible discriminators

console.log('🔍 Calculating possible Phoenix discriminators\n');

// Method 1: Simple index (0, 1, 2, etc.)
console.log('Method 1: Simple index');
console.log('  InitializeMarket might be: 0, 1, or 100');
console.log('');

// Method 2: Anchor-style (sha256 of "global:initialize_market")
console.log('Method 2: Anchor-style discriminator');
const anchorHash = crypto.createHash('sha256').update('global:initialize_market').digest();
console.log('  Discriminator (8 bytes):', anchorHash.slice(0, 8).toString('hex'));
console.log('  As array:', Array.from(anchorHash.slice(0, 8)));
console.log('');

// Method 3: Just function name
const funcHash = crypto.createHash('sha256').update('initialize_market').digest();
console.log('Method 3: Function name only');
console.log('  Discriminator (8 bytes):', funcHash.slice(0, 8).toString('hex'));
console.log('  As array:', Array.from(funcHash.slice(0, 8)));
console.log('');

// Method 4: Shank-style (used by some Solana programs)
const shankHash = crypto.createHash('sha256').update('InitializeMarket').digest();
console.log('Method 4: Shank-style (PascalCase)');
console.log('  Discriminator (8 bytes):', shankHash.slice(0, 8).toString('hex'));
console.log('  As array:', Array.from(shankHash.slice(0, 8)));
console.log('');

// Method 5: Check SDK exports
console.log('Method 5: From Phoenix SDK');
console.log('  The SDK shows these discriminators:');
console.log('  - placeLimitOrder: 2');
console.log('  - placeLimitOrderWithFreeFunds: 3');
console.log('  - reduceOrder: 4');
console.log('  - cancelAllOrders: 6');
console.log('  - requestSeat: 14');
console.log('');
console.log('  Pattern: Simple u8 index');
console.log('  InitializeMarket is likely: 0 or 1 (first instruction)');
console.log('');

console.log('💡 Recommendation: Phoenix likely uses simple u8 discriminators');
console.log('   Try: 0, 1, or check if market creation is restricted');
