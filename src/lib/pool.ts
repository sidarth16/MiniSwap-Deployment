import { PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";

import { connection, PROGRAM_ID, getTokenBalance } from "@/lib/solana";
import { fromBaseUnits } from "@/utils/format";

const LP_TOKEN_DECIMALS = 9;

const programId = new PublicKey(PROGRAM_ID);

export function getPoolPda(
  tokenA: PublicKey,
  tokenB: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), tokenA.toBuffer(), tokenB.toBuffer()],
    programId
  );
}

export async function checkPoolExistsOnDevnet(
  tokenA: string,
  tokenB: string
): Promise<boolean> {
  const tokenAPub = new PublicKey(tokenA);
  const tokenBPub = new PublicKey(tokenB);
  const [poolPda] = getPoolPda(tokenAPub, tokenBPub);
  const accountInfo = await connection.getAccountInfo(poolPda, "finalized");
  return accountInfo !== null;
}

export async function getUserTokenBalances(tokenA: string, tokenB: string, walletPubkey: PublicKey) {
  try{
    const tokenAPub = new PublicKey(tokenA);
    const tokenBPub = new PublicKey(tokenB);

    
    const [poolPDA] = getPoolPda(tokenAPub, tokenBPub);
    
    const idl = await Program.fetchIdl(programId, { connection });
    if (!idl) throw new Error("Failed to fetch IDL");
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, {} as any, AnchorProvider.defaultOptions());
    const program = new Program(idl, provider);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = await (program.account as any).pool.fetch(poolPDA);
    
    const balanceA = fromBaseUnits(
      await getTokenBalance(tokenAPub, walletPubkey),
      pool.tokenADecimals
    );
    const balanceB = fromBaseUnits(
      await getTokenBalance(tokenBPub, walletPubkey),
      pool.tokenBDecimals
    );

    const vaultA = fromBaseUnits(
      BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount),
      pool.tokenADecimals
    );
    const vaultB = fromBaseUnits(
      BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount),
      pool.tokenBDecimals
    );
    
    const balanceLP = fromBaseUnits(
      await getTokenBalance(pool.lpMint, walletPubkey),
      LP_TOKEN_DECIMALS
    )

    return {
      userBalanceTokenA: balanceA,  userBalanceTokenB: balanceB, userBalanceLP: balanceLP,
      vaultBalanceTokenA: vaultA,  vaultBalanceTokenB: vaultB
    };
  }
  catch (err) {
    console.error("Fetch Balances error:", err);
    return null;
  }
}

export async function getPoolReservesAndSupply(tokenA: string, tokenB: string) {
  try {
    const tokenAPub = new PublicKey(tokenA);
    const tokenBPub = new PublicKey(tokenB);
    const programId = new PublicKey(PROGRAM_ID);

    const [poolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
      programId
    );

    console.log("poolpDA : ",poolPDA.toBase58() );

    const idl = await Program.fetchIdl(programId, { connection });
    if (!idl) throw new Error("Failed to fetch IDL");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, {} as any, AnchorProvider.defaultOptions());
    const program = new Program(idl, provider);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = await (program.account as any).pool.fetch(poolPDA);

    const tokenADecimals = pool.tokenADecimals;
    const tokenBDecimals = pool.tokenBDecimals;

    const vaultA = BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount);
    const vaultB = BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount);
    const supplyLP = BigInt((await connection.getTokenSupply(pool.lpMint)).value.amount);

    return { vaultA, vaultB, supplyLP, tokenADecimals, tokenBDecimals };
  } catch (err) {
    console.error("Fetch Reserves error:", err);
    return null;
  }
}
