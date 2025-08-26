import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {getMint } from "@solana/spl-token";

const DEVNET_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = "FkFy7DjX1fJe4fUqxkeUnGtkd4rL46769HE3iSwVjoYJ"

const connection = new Connection(DEVNET_URL, 'confirmed');


/**
 * Check whether a given address is a valid SPL token mint on Solana Devnet.
 * Returns true if the address exists and is a token mint.
 */
export async function isValidSolanaTokenAddress(addr: string): Promise<boolean> {
  try {
    const pubkey = new PublicKey(addr); // throws if invalid
    await getMint(connection, pubkey); //throw if the account doesn't exist OR isn't a mint
    return true;
  } catch {
    return false;
  }
}


export async function checkPoolOnDevnet(tokenA: string, tokenB: string) {
  // Validate token addresses
  try {
    const tokenAPub = new PublicKey(tokenA);
    const tokenBPub = new PublicKey(tokenB);

    const programId = new PublicKey(PROGRAM_ID); // replace with real program ID

    const [poolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
      programId
    );
    console.log(poolPDA.toBase58())

    // const connection = new Connection("https://api.devnet.solana.com");
    const account = await connection.getAccountInfo(poolPDA);

    return !!account; // true if exists, false if not
  }
  catch (err) {
    console.error("Invalid token address or PDA error:", err);
    return false; // invalid address or failed
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

    const idl = await anchor.Program.fetchIdl(programId, { connection });
    if (!idl) throw new Error("Failed to fetch IDL");
    const provider = new anchor.AnchorProvider(connection, {} as any, anchor.AnchorProvider.defaultOptions());
    const program = new anchor.Program(idl, provider);

    const pool = await program.account.pool.fetch(poolPDA);

    const tokenADecimals = pool.tokenADecimals;
    const tokenBDecimals = pool.tokenBDecimals;

    const vaultA = BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount);
    const vaultB = BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount);
    const supplyLP = BigInt((await connection.getTokenSupply(pool.lpMint)).value.amount);

    return { vaultA, vaultB, supplyLP, tokenADecimals, tokenBDecimals };
  }
  catch (err) {
    return null;
  }
}