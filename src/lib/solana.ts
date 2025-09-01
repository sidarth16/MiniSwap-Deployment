// keeps constants in one place

import { Connection, PublicKey } from "@solana/web3.js";
// import { getAssociatedTokenAddress } from "@solana/spl-token";

export const connection = new Connection("https://api.devnet.solana.com");

// Replace with your program ID
export const PROGRAM_ID = new PublicKey(
  "2uhoS5V5n94p7TPW9NCcbuPcLrefPBKj9Ud76JJEk2wy"
);

export async function isValidSolanaTokenAddress(addr: string): Promise<boolean> {
  try {
    const pubkey = new PublicKey(addr); // throws if invalid
    // await getMint(connection, pubkey);  // throws if not a mint
    return true;
  } catch {
    return false;
  }
}

export async function getTokenBalance(
  tokenMint: PublicKey,
  walletPubkey: PublicKey
): Promise<bigint> {
  const resp = await connection.getTokenAccountsByOwner(walletPubkey, { mint: tokenMint });
  if (resp.value.length === 0) return BigInt(0);

  const balanceResp = await connection.getTokenAccountBalance(resp.value[0].pubkey);
  return BigInt(balanceResp.value.amount);
}

// export async function getUserTokenBalances(tokenA: string, tokenB: string, walletPubkey: PublicKey) {
//   const tokenAPub = new PublicKey(tokenA);
//   const tokenBPub = new PublicKey(tokenB);

//   const balanceA = await getTokenBalance(tokenAPub, walletPubkey);
//   const balanceB = await getTokenBalance(tokenBPub, walletPubkey);

//   return { balanceTokenA: balanceA, balanceTokenB: balanceB };
// }


// export async function getTokenBalance(tokenA: string, tokenB: string, walletPubkey: PublicKey ) {
//   try {
//     const { getAssociatedTokenAddress, getAccount } = await import("@solana/spl-token");
//     // console.log("fetching balances", walletPubkey);
//     // if (!walletPubkey) return null;
//     const tokenAPub = new PublicKey(tokenA);
//     const tokenBPub = new PublicKey(tokenB);

//     const ataA = await getAssociatedTokenAddress(tokenAPub, walletPubkey);
//     const ataB = await getAssociatedTokenAddress(tokenBPub, walletPubkey);

//     const balanceTokenA = BigInt((await connection.getTokenAccountBalance(ataA)).value.amount);
//     const balanceTokenB = BigInt((await connection.getTokenAccountBalance(ataB)).value.amount);

//     // const balanceTokenA = BigInt(10000);
//     // const balanceTokenB = BigInt(10000);

//     return { balanceTokenA, balanceTokenB};
//   } catch (err) {
//     // console.error("Fetch Token Balances error:", err);
//     return null;
//   }
// }