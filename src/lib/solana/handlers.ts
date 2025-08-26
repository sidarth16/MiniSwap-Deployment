import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import * as estimate from "@/lib/solana/estimate"

import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

const DEVNET_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = "FkFy7DjX1fJe4fUqxkeUnGtkd4rL46769HE3iSwVjoYJ"

const connection = new Connection(DEVNET_URL, 'confirmed');


/* -------------------------------
   Helper: Get or create associated token account
--------------------------------- */

async function getOrCreateATA(mint: PublicKey, owner: PublicKey, provider: anchor.AnchorProvider) {
  const ata = await getAssociatedTokenAddress(mint, owner);
  const accountInfo = await provider.connection.getAccountInfo(ata);
  if (!accountInfo) {
    // Create ATA if not exists
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(owner, ata, owner, mint)
    );
    await provider.sendAndConfirm(tx);
  }
  return ata;
}

export async function handleInitPool(
    tokenA: string,
    tokenB: string,
    wallet: AnchorWallet,
) {
    if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");
    
    try{
        console.log(1);
        const provider = new anchor.AnchorProvider(
            connection, 
            wallet, 
            anchor.AnchorProvider.defaultOptions()
        );
        const idl = await anchor.Program.fetchIdl(PROGRAM_ID, provider);
        if (!idl) throw new Error("Failed to fetch IDL");
        console.log(2);

        const program = new anchor.Program(idl, provider);

        console.log(3);

        // Validate addresses
        const tokenAPub = new anchor.web3.PublicKey(tokenA);
        const tokenBPub = new anchor.web3.PublicKey(tokenB);
        console.log("Token A:", tokenAPub.toBase58());
        console.log("Token B:", tokenBPub.toBase58());

        // Derive the pool PDA 
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
           new anchor.web3.PublicKey(PROGRAM_ID)
        );
        
        const [tokenAVault] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), poolPDA.toBuffer(), Buffer.from("a")],
            program.programId
        );
        
        const [tokenBVault] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), poolPDA.toBuffer(), Buffer.from("b")],
            program.programId
        );
    
        const [lpMint] = PublicKey.findProgramAddressSync(
            [Buffer.from("lp_mint"), poolPDA.toBuffer()],
            program.programId
        );

        console.log("Pool :", poolPDA.toBase58() );
        console.log("Token A Vault:", tokenAVault.toBase58());
        console.log("Token B Vault:", tokenBVault.toBase58());
        console.log("LP Mint:", lpMint.toBase58());

        // Call the on-chain initialize_pool instruction
        const txSig = await program.methods
        .initializePool(new anchor.BN(10))
        .accounts({
            pool: poolPDA,
            authority: wallet.publicKey,
            tokenAMint: tokenAPub,
            tokenBMint: tokenBPub,
            tokenAVault: tokenAVault,
            tokenBVault: tokenBVault,
            lpMint: lpMint,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

        console.log("✅ Pool Created! Tx:", txSig);
        return txSig;
    }
    catch (err) {
        console.error("Failed to Create Pool:", err);
        throw err;
    }
}


export async function handleAddLiquidity(
    tokenA: string,
    tokenB: string,
    amountA: number,
    amountB: number,
    wallet: AnchorWallet
) {
    if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");
    
    try{
        console.log(1);
        const provider = new anchor.AnchorProvider(
            connection, 
            wallet, 
            anchor.AnchorProvider.defaultOptions()
        );
        const idl = await anchor.Program.fetchIdl(PROGRAM_ID, provider);
        if (!idl) throw new Error("Failed to fetch IDL");
        console.log(2);

        const program = new anchor.Program(idl, provider);

        console.log(3);

        // Validate addresses
        const tokenAPub = new anchor.web3.PublicKey(tokenA);
        const tokenBPub = new anchor.web3.PublicKey(tokenB);
        console.log("Token A:", tokenAPub.toBase58());
        console.log("Token B:", tokenBPub.toBase58());

        // Derive the pool PDA 
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
           new anchor.web3.PublicKey(PROGRAM_ID)
        );
        console.log('Pool PDA:', poolPDA.toBase58());

        // Fetch pool account (Anchor auto-decodes for you)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pool = await (program.account as any).account.pool.fetch(poolPDA);
        console.log("Pool fetched:");
        console.log("Token A Vault:", pool.tokenAVault.toBase58());
        console.log("Token B Vault:", pool.tokenBVault.toBase58());
        console.log("LP Mint:", pool.lpMint.toBase58());

        const tokenADecimals:number = pool.tokenADecimals;
        const tokenBDecimals:number = pool.tokenBDecimals;

        // Derive user token accounts (ATAs)
        const userTokenA = await getOrCreateATA(tokenAPub, wallet.publicKey, provider);
        console.log("User Token A ATA:", userTokenA.toBase58());
        const userTokenB = await getOrCreateATA(tokenBPub, wallet.publicKey, provider);
        console.log("User Token B ATA:", userTokenB.toBase58());
        const userLP = await getOrCreateATA(pool.lpMint, wallet.publicKey, provider);
        console.log("User LP Token ATA:", userLP.toBase58());

        const vaultA = BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount);
        const vaultB = BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount);
        const supplyLP = BigInt((await connection.getTokenSupply(pool.lpMint)).value.amount);
       
        const estLP = estimate.estimateLpToMint(
            vaultA, vaultB, supplyLP, BigInt(amountA), BigInt(amountB), tokenADecimals, tokenBDecimals
        );
        console.log("📊 Estimated LP to mint:", estLP.toString());

        // Call the on-chain add_liquidity instruction
        const txSig = await program.methods
        .addLiquidity(new anchor.BN(amountA), new anchor.BN(amountB))
        .accounts({
            pool: poolPDA,
            user: wallet.publicKey,
            userTokenA: userTokenA,
            userTokenB: userTokenB,
            tokenAVault: pool.tokenAVault,
            tokenBVault: pool.tokenBVault,
            lpMint: pool.lpMint,
            userLpToken: userLP,
            tokenProgram:TOKEN_PROGRAM_ID,
        })
        .rpc();

        console.log("✅ Liquidity added. Tx:", txSig);
        return txSig;
    }
    catch (err) {
        console.error("Failed to add liquidity:", err);
        throw err;
    }
}



export async function handleRemoveLiquidity(
    tokenA: string,
    tokenB: string,
    amountLP: number,
    wallet: AnchorWallet,
) {
    if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");
    
    try{
        const provider = new anchor.AnchorProvider(
            connection, 
            wallet,
            anchor.AnchorProvider.defaultOptions()
        );
        const idl = await anchor.Program.fetchIdl(PROGRAM_ID, provider);
        if (!idl) throw new Error("Failed to fetch IDL");
        const program = new anchor.Program(idl, provider);

        // Validate addresses
        const tokenAPub = new anchor.web3.PublicKey(tokenA);
        const tokenBPub = new anchor.web3.PublicKey(tokenB);
        console.log("Token A:", tokenAPub.toBase58());
        console.log("Token B:", tokenBPub.toBase58());

        // Derive the pool PDA 
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
           new anchor.web3.PublicKey(PROGRAM_ID)
        );
        console.log('Pool PDA:', poolPDA.toBase58());

        // Fetch pool account (Anchor auto-decodes for you)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pool = await (program.account as any).account.pool.fetch(poolPDA);
        console.log("Token A Vault:", pool.tokenAVault.toBase58());
        console.log("Token B Vault:", pool.tokenBVault.toBase58());
        console.log("LP Mint:", pool.lpMint.toBase58());

        // Derive user token accounts (ATAs)
        const userTokenA = await getOrCreateATA(tokenAPub, wallet.publicKey, provider);
        console.log("User Token A ATA:", userTokenA.toBase58());
        const userTokenB = await getOrCreateATA(tokenBPub, wallet.publicKey, provider);
        console.log("User Token B ATA:", userTokenB.toBase58());
        const userLP = await getOrCreateATA(pool.lpMint, wallet.publicKey, provider);
        console.log("User LP Token ATA:", userLP.toBase58());

        // Esimating token vaules
        const vaultA = BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount);
        const vaultB = BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount);
        const supplyLP = BigInt((await connection.getTokenSupply(pool.lpMint)).value.amount);
        estimate.estimateWithdrawTokenAmounts(vaultA, vaultB, supplyLP, BigInt(amountLP));

        // Call the on-chain remove_liquidity instruction
        const txSig = await program.methods
        .removeLiquidity(new anchor.BN(amountLP))
        .accounts({
            pool: poolPDA,
            user: wallet.publicKey,
            tokenAVault: pool.tokenAVault,
            tokenBVault: pool.tokenBVault,
            lpMint: pool.lpMint,
            userLpToken: userLP,
            userTokenA: userTokenA,
            userTokenB: userTokenB,
            tokenProgram: TOKEN_PROGRAM_ID
        })
        .rpc();

        console.log("✅ Liquidity Removed. Tx:", txSig);
        return txSig;
    }
    catch (err) {
        console.error("Failed to Remove liquidity:", err);
        throw err;
    }
}



export async function handleSwapTokens(
    tokenA: string,
    tokenB: string,
    inputToken: string,
    amountSwapIn: number,
    amountMinSwapOut: number,
    wallet: AnchorWallet,
) {
    if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");
    
    try{
        const provider = new anchor.AnchorProvider(
            connection, 
            wallet,
            anchor.AnchorProvider.defaultOptions()
        );
        const idl = await anchor.Program.fetchIdl(PROGRAM_ID, provider);
        if (!idl) throw new Error("Failed to fetch IDL");
        const program = new anchor.Program(idl, provider);

        // Validate addresses
        const tokenAPub = new anchor.web3.PublicKey(tokenA);
        const tokenBPub = new anchor.web3.PublicKey(tokenB);
        const inputTokenPub = new anchor.web3.PublicKey(inputToken);

        console.log("Token A:", tokenAPub.toBase58());
        console.log("Token B:", tokenBPub.toBase58());
        console.log("inputToken:", inputTokenPub.toBase58());


        // Derive the pool PDA 
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
           new anchor.web3.PublicKey(PROGRAM_ID)
        );
        console.log('Pool PDA:', poolPDA.toBase58());

        // Fetch pool account (Anchor auto-decodes for you)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pool = await (program.account as any).account.pool.fetch(poolPDA);
        console.log("Pool fetched:");
        console.log("Token A Vault:", pool.tokenAVault.toBase58());
        console.log("Token B Vault:", pool.tokenBVault.toBase58());
        console.log("LP Mint:", pool.lpMint.toBase58());

        console.log(4);
        // Derive user token accounts (ATAs)
        const userTokenA = await getOrCreateATA(tokenAPub, wallet.publicKey, provider);
        console.log("User Token A ATA:", userTokenA.toBase58());
        const userTokenB = await getOrCreateATA(tokenBPub, wallet.publicKey, provider);
        console.log("User Token B ATA:", userTokenB.toBase58());
        const userLP = await getOrCreateATA(pool.lpMint, wallet.publicKey, provider);
        console.log("User LP Token ATA:", userLP.toBase58());

        // Esimating token vaules
        const vaultA = BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount);
        const vaultB = BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount);
        let estAmountOut;
        if (inputTokenPub == tokenAPub) {
            estAmountOut = estimate.estimateSwappedTokenOut(vaultA, vaultB, BigInt(amountSwapIn));
        }else{
            estAmountOut = estimate.estimateSwappedTokenOut(vaultB, vaultA, BigInt(amountSwapIn));
        }
        if (estAmountOut < amountMinSwapOut){
            throw('Swapped out Amount less than required Minimum amount')
        }

        // Call the on-chain add_liquidity instruction
        const txSig = await program.methods
        .swap(inputTokenPub, new anchor.BN(amountSwapIn), new anchor.BN(amountMinSwapOut))
        .accounts({
            pool: poolPDA,
            user: wallet.publicKey,
            tokenAVault: pool.tokenAVault,
            tokenBVault: pool.tokenBVault,
            userTokenAAccount: userTokenA,
            userTokenBAccount: userTokenB,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

        console.log("✅ Token Swapped. Tx:", txSig);
        return txSig;
    }
    catch (err) {
        console.error("Failed to Swap Token:", err);
        throw err;
    }
}
