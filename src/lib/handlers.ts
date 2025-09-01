import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";

import * as estimate from "@/lib/estimate"
import { connection, PROGRAM_ID } from "@/lib/solana";

// Solana Token Program ID (same as from @solana/spl-token)
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {

    const [ata] =  PublicKey.findProgramAddressSync(
        [
            owner.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return ata;
}

function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  mint: PublicKey
): TransactionInstruction {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: ata, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    // { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.alloc(0), // no data, just instruction
  });
}

/**
 * Returns:
 *   { ata, ix }
 *   - ata: The derived ATA address
 *   - ix: A TransactionInstruction if ATA doesn't exist, else null
 */
export async function getOrCreateATA(
  mint: PublicKey,
  owner: PublicKey
): Promise<{ ata: PublicKey; ix: TransactionInstruction | null }> {
    const ata = getAssociatedTokenAddress(mint, owner);
    // console.log("Derived User Token A ATA:", ata.toBase58());
    const accountInfo = await connection.getAccountInfo(ata);
    // console.log("User Token A ATA Exists. .? : ", accountInfo);

    if (!accountInfo) {
        return {
        ata,
        ix: createAssociatedTokenAccountInstruction(owner, ata, owner, mint),
        };
    }
    
    return { ata, ix: null };
}



/* -------------------------------
   Helper: Get or create associated token account
--------------------------------- */

// async function getOrCreateATA(mint: PublicKey, owner: PublicKey, provider: AnchorProvider) {
//     const {getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = await import("@solana/spl-token");

//     const ata = await getAssociatedTokenAddress(mint, owner);
//     const accountInfo = await provider.connection.getAccountInfo(ata);
//     if (!accountInfo) {
//         // Create ATA if not exists
//         const tx = new Transaction().add(
//         createAssociatedTokenAccountInstruction(owner, ata, owner, mint)
//         );
//         await provider.sendAndConfirm(tx);
//     }
//     return ata;
// }

export async function handleInitPool(
    tokenA: string,
    tokenB: string,
    wallet: AnchorWallet,
) {
    // const {TOKEN_PROGRAM_ID} = await import("@solana/spl-token");

    if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");
    
    try{
        const provider = new AnchorProvider(
            connection, 
            wallet, 
            AnchorProvider.defaultOptions()
        );
        const idl = await Program.fetchIdl(PROGRAM_ID, provider);
        if (!idl) throw new Error("Failed to fetch IDL");

        const program = new Program(idl, provider);


        // Validate addresses
        const tokenAPub = new PublicKey(tokenA);
        const tokenBPub = new PublicKey(tokenB);
        console.log("Token A:", tokenAPub.toBase58());
        console.log("Token B:", tokenBPub.toBase58());

        // Derive the pool PDA 
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
           new PublicKey(PROGRAM_ID)
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
        .initializePool()
        .accounts({
            pool: poolPDA,
            authority: wallet.publicKey,
            tokenAMint: tokenAPub,
            tokenBMint: tokenBPub,
            tokenAVault: tokenAVault,
            tokenBVault: tokenBVault,
            lpMint: lpMint,
            systemProgram: SystemProgram.programId,
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
        const provider = new AnchorProvider(
            connection, 
            wallet, 
            AnchorProvider.defaultOptions()
        );
        const idl = await Program.fetchIdl(PROGRAM_ID, provider);
        if (!idl) throw new Error("Failed to fetch IDL");

        const program = new Program(idl, provider);


        // Validate addresses
        const tokenAPub = new PublicKey(tokenA);
        const tokenBPub = new PublicKey(tokenB);
        console.log("Token A:", tokenAPub.toBase58());
        console.log("Token B:", tokenBPub.toBase58());

        // Derive the pool PDA 
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
           new PublicKey(PROGRAM_ID)
        );
        console.log('Pool PDA:', poolPDA.toBase58());

        // ----- Fetch pool account (Anchor auto-decodes for you)--------
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pool = await (program.account as any).pool.fetch(poolPDA);
        console.log("Pool fetched:");
        console.log("Token A Vault:", pool.tokenAVault.toBase58());
        console.log("Token B Vault:", pool.tokenBVault.toBase58());
        console.log("LP Mint:", pool.lpMint.toBase58());
        
        // // ------Estimations (for debugging)-----
        // const tokenADecimals:number = pool.tokenADecimals;
        // const tokenBDecimals:number = pool.tokenBDecimals;
        // const vaultA = BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount);
        // const vaultB = BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount);
        // const supplyLP = BigInt((await connection.getTokenSupply(pool.lpMint)).value.amount);
        // const estLP = estimate.estimateLpToMint(
        //     vaultA, vaultB, supplyLP, BigInt(amountA), BigInt(amountB), tokenADecimals, tokenBDecimals
        // );
        // console.log("📊 Estimated LP to mint:", estLP.toString());


        // ----- Derive user token accounts (ATAs) ------

        // const userTokenA = await getOrCreateATA(tokenAPub, wallet.publicKey, provider);
        // const userTokenB = await getOrCreateATA(tokenBPub, wallet.publicKey, provider);
        // const userLP = await getOrCreateATA(pool.lpMint, wallet.publicKey, provider);
        
        const { ata: userTokenA, ix: ixA } = await getOrCreateATA(tokenAPub, wallet.publicKey);
        console.log("User Token A ATA:", userTokenA.toBase58());
        
        // console.log("My method")
        // const resp = await connection.getTokenAccountsByOwner(wallet.publicKey, { mint: tokenAPub });
        // if (resp.value.length === 0) console.log('No ATA Found !');
        // else console.log('ATA Found : ', resp.value[0].pubkey.toBase58());

        // if (ixA) { 
        //     const tx = new Transaction().add(ixA);
        //     const sig = await provider.sendAndConfirm(tx);
        //     console.log("✅ ATA Created", sig);
        // }
        const { ata: userTokenB, ix: ixB } = await getOrCreateATA(tokenBPub, wallet.publicKey);
        console.log("User Token B ATA:", userTokenB.toBase58());
        // if (ixB) { 
        //     const tx = new Transaction().add(ixB);
        //     const sig = await provider.sendAndConfirm(tx);
        //     console.log("✅ ATA Created", sig);
        // }
        const { ata: userLP, ix: ixLP } = await getOrCreateATA(pool.lpMint, wallet.publicKey);
        console.log("User LP Token ATA:", userLP.toBase58());
        // if (ixLP) { 
        //     const tx = new Transaction().add(ixLP);
        //     const sig = await provider.sendAndConfirm(tx);
        //     console.log("✅ ATA Created", sig);
        // }

        //--------- collect ATA creation ix’s--------------
        const ataIxs = [ixA, ixB, ixLP].filter((ix) => ix !== null);

        // -------now build the addLiquidity tx---------

        const tx = new Transaction();
        ataIxs.forEach(ix => tx.add(ix!));  // add ATA creation ixs if needed        
        tx.add(         // add your program instruction
            await program.methods
                .addLiquidity(new BN(amountA), new BN(amountB))
                .accounts({
                pool: poolPDA,
                user: wallet.publicKey,
                userTokenA,
                userTokenB,
                tokenAVault: pool.tokenAVault,
                tokenBVault: pool.tokenBVault,
                lpMint: pool.lpMint,
                userLpToken: userLP,
                tokenProgram: TOKEN_PROGRAM_ID,
                })
            .instruction()
        );

        // send in one go
        const txSig = await provider.sendAndConfirm(tx, [], {commitment: "finalized"});
        console.log("✅ Liquidity added. Tx:", txSig);
        return txSig
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
        const provider = new AnchorProvider(
            connection, 
            wallet,
            AnchorProvider.defaultOptions()
        );
        const idl = await Program.fetchIdl(PROGRAM_ID, provider);
        if (!idl) throw new Error("Failed to fetch IDL");
        const program = new Program(idl, provider);

        // Validate addresses
        const tokenAPub = new PublicKey(tokenA);
        const tokenBPub = new PublicKey(tokenB);
        console.log("Token A:", tokenAPub.toBase58());
        console.log("Token B:", tokenBPub.toBase58());

        // Derive the pool PDA 
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
           new PublicKey(PROGRAM_ID)
        );
        console.log('Pool PDA:', poolPDA.toBase58());

        // Fetch pool account (Anchor auto-decodes for you)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pool = await (program.account as any).pool.fetch(poolPDA);
        console.log("Token A Vault:", pool.tokenAVault.toBase58());
        console.log("Token B Vault:", pool.tokenBVault.toBase58());
        console.log("LP Mint:", pool.lpMint.toBase58());

        // // Derive user token accounts (ATAs)
        // const userTokenA = await getOrCreateATA(tokenAPub, wallet.publicKey, provider);
        // console.log("User Token A ATA:", userTokenA.toBase58());
        // const userTokenB = await getOrCreateATA(tokenBPub, wallet.publicKey, provider);
        // console.log("User Token B ATA:", userTokenB.toBase58());
        // const userLP = await getOrCreateATA(pool.lpMint, wallet.publicKey, provider);
        // console.log("User LP Token ATA:", userLP.toBase58());

        const { ata: userTokenA, ix: ixA } = await getOrCreateATA(tokenAPub, wallet.publicKey);
        const { ata: userTokenB, ix: ixB } = await getOrCreateATA(tokenBPub, wallet.publicKey);
        const { ata: userLP, ix: ixLP } = await getOrCreateATA(pool.lpMint, wallet.publicKey);

        // // Esimating token vaules
        // const vaultA = BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount);
        // const vaultB = BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount);
        // const supplyLP = BigInt((await connection.getTokenSupply(pool.lpMint)).value.amount);
        // estimate.estimateWithdrawTokenAmounts(vaultA, vaultB, supplyLP, BigInt(amountLP));

        const ataIxs = [ixA, ixB, ixLP].filter((ix) => ix !== null);

        // -------now build the addLiquidity tx---------

        const tx = new Transaction();
        ataIxs.forEach(ix => tx.add(ix!));  // add ATA creation ixs if needed        
        tx.add(         // add your program instruction
            await program.methods
            .removeLiquidity(new BN(amountLP))
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
            .instruction()
        );

        // send in one go
        const txSig = await provider.sendAndConfirm(tx, [], {commitment: "finalized"});
        console.log("✅ Liquidity Removed. Tx:", txSig);
        return txSig   
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
        const provider = new AnchorProvider(
            connection, 
            wallet,
            AnchorProvider.defaultOptions()
        );
        const idl = await Program.fetchIdl(PROGRAM_ID, provider);
        if (!idl) throw new Error("Failed to fetch IDL");
        const program = new Program(idl, provider);

        // Validate addresses
        const tokenAPub = new PublicKey(tokenA);
        const tokenBPub = new PublicKey(tokenB);
        const inputTokenPub = new PublicKey(inputToken);

        console.log("Token A:", tokenAPub.toBase58());
        console.log("Token B:", tokenBPub.toBase58());
        console.log("inputToken:", inputTokenPub.toBase58());


        // Derive the pool PDA 
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('pool'), tokenAPub.toBuffer(), tokenBPub.toBuffer()],
           new PublicKey(PROGRAM_ID)
        );
        console.log('Pool PDA:', poolPDA.toBase58());

        // Fetch pool account (Anchor auto-decodes for you)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pool = await (program.account as any).pool.fetch(poolPDA);
        console.log("Pool fetched:");
        console.log("Token A Vault:", pool.tokenAVault.toBase58());
        console.log("Token B Vault:", pool.tokenBVault.toBase58());


        // Derive user token accounts (ATAs)
        const { ata: userTokenA, ix: ixA } = await getOrCreateATA(tokenAPub, wallet.publicKey);
        const { ata: userTokenB, ix: ixB } = await getOrCreateATA(tokenBPub, wallet.publicKey);

        console.log("User Token A ATA:", userTokenA.toBase58());
        console.log("User Token B ATA:", userTokenB.toBase58());



        // // Esimating token vaules
        // const vaultA = BigInt((await connection.getTokenAccountBalance(pool.tokenAVault)).value.amount);
        // const vaultB = BigInt((await connection.getTokenAccountBalance(pool.tokenBVault)).value.amount);
        // let estAmountOut;
        // if (inputTokenPub == tokenAPub) {
        //     estAmountOut = estimate.estimateSwappedTokenOut(vaultA, vaultB, BigInt(amountSwapIn));
        // }else{
        //     estAmountOut = estimate.estimateSwappedTokenOut(vaultB, vaultA, BigInt(amountSwapIn));
        // }
        // if (estAmountOut < amountMinSwapOut){
        //     throw('Swapped out Amount less than required Minimum amount')
        // }

        // Call the on-chain swap instruction
        
        const tx = new Transaction();
        
        const ataIxs = [ixA, ixB].filter((ix) => ix !== null);
        ataIxs.forEach(ix => tx.add(ix!));  // add ATA creation ixs (wherever needed)
        
        tx.add(         // add your program instruction
            await program.methods
            .swap(inputTokenPub, new BN(amountSwapIn), new BN(amountMinSwapOut))
            .accounts({
                pool: poolPDA,
                user: wallet.publicKey,
                tokenAVault: pool.tokenAVault,
                tokenBVault: pool.tokenBVault,
                userTokenAAccount: userTokenA,
                userTokenBAccount: userTokenB,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction()
        )
        // send in one go
        const txSig = await provider.sendAndConfirm(tx)//, [], {commitment: "finalized"});//, skipPreflight: true});
        console.log("✅ Token Swapped. Tx:", txSig);
        return txSig;
    }
    catch (err) {
        console.error("Failed to Swap Token:", err);
        throw err;
    }
}
