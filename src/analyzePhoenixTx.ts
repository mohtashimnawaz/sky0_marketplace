import { Connection, PublicKey } from '@solana/web3.js';
import { RPC_URL, PHOENIX_PROGRAM_ID } from './config';

async function main() {
  console.log('🔍 Analyzing Phoenix transactions...\n');
  
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Get recent transactions for Phoenix program
  const signatures = await connection.getSignaturesForAddress(
    PHOENIX_PROGRAM_ID,
    { limit: 50 }
  );
  
  console.log(`Found ${signatures.length} recent transactions\n`);
  
  // Look for InitializeMarket transactions
  for (const sig of signatures) {
    try {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });
      
      if (!tx || !tx.meta) continue;
      
      const instructions = tx.transaction.message.instructions;
      
      for (const ix of instructions) {
        if ('programId' in ix && ix.programId.equals(PHOENIX_PROGRAM_ID)) {
          // Check if this might be an initialize instruction
          if ('data' in ix && ix.data) {
            const data = Buffer.from(ix.data, 'base64');
            const discriminator = data[0];
            
            // Log all unique discriminators
            console.log(`Discriminator: ${discriminator}, Accounts: ${ix.accounts?.length || 0}`);
            
            if (discriminator === 100 || discriminator === 0) {
              console.log('\n🎯 Potential InitializeMarket instruction found!');
              console.log('Signature:', sig.signature);
              console.log('Discriminator:', discriminator);
              console.log('Number of accounts:', ix.accounts?.length || 0);
              
              if (ix.accounts) {
                console.log('\nAccount order:');
                ix.accounts.forEach((acc, idx) => {
                  console.log(`  ${idx}: ${acc.toBase58()}`);
                });
              }
              
              console.log('\nInstruction data (hex):', data.toString('hex'));
              console.log('');
            }
          }
        }
      }
    } catch (e) {
      // Skip errors
    }
  }
  
  console.log('\n✅ Analysis complete');
}

main().catch(console.error);
