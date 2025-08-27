'use client';
import type { AnchorWallet } from "@solana/wallet-adapter-react";

const DEVNET_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = "FkFy7DjX1fJe4fUqxkeUnGtkd4rL46769HE3iSwVjoYJ"

/**
 * Check whether a given address is a valid SPL token mint on Solana Devnet.
 * Returns true if the address exists and is a token mint.
 */
export async function isValidSolanaTokenAddress(addr: string): Promise<boolean> {
  try {
    const {Connection, PublicKey} = await import("@solana/web3.js");
    const {getMint} = await import("@solana/spl-token");
    const connection = new Connection(DEVNET_URL, 'confirmed');

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
    const {Connection, PublicKey} = await import("@solana/web3.js");
    const connection = new Connection(DEVNET_URL, 'confirmed');


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

    const {AnchorProvider, Program} = await import("@coral-xyz/anchor");
    const {Connection, PublicKey} = await import("@solana/web3.js");
    const connection = new Connection(DEVNET_URL, 'confirmed');


    const tokenAPub = new PublicKey(tokenA);
    const tokenBPub = new PublicKey(tokenB);
    const programId = new PublicKey(PROGRAM_ID);

    const [poolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
      programId
    );

    const idl = await Program.fetchIdl(programId, { connection });
    if (!idl) throw new Error("Failed to fetch IDL");
    const provider = new AnchorProvider(
      connection, {} as AnchorWallet, AnchorProvider.defaultOptions()
    );
    const program = new Program(idl, provider);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = await (program.account as any).pool.fetch(poolPDA);
    console.log('pool fetched')

    const tokenADecimals = pool.tokenADecimals;
    const tokenBDecimals = pool.tokenBDecimals;

    const vaultA = BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount);
    const vaultB = BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount);
    const supplyLP = BigInt((await connection.getTokenSupply(pool.lpMint)).value.amount);

    return { vaultA, vaultB, supplyLP, tokenADecimals, tokenBDecimals };
  }
  catch (err) {
    console.error("Fetch Reserves error:", err);
    return null;
  }
}