"use client";

import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

import TokenInputs from "@/components/TokenInputs";
import PoolStatus from "@/components/PoolStatus";
import RemoveLiquidityForm from "@/components/RemoveLiquidityForm";

import { usePoolStatus } from "@/hooks/usePoolStatus";
import { useTokenBalances } from "@/hooks/useTokenBalances";

import ErrorLogs from "@/components/ErrorLogs";
import TxSig from "@/components/TxSig";

import { handleRemoveLiquidity } from "@/lib/handlers"



export default function HomePage() {
  const wallet = useAnchorWallet();
  const connected = !!wallet?.publicKey;

  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null); 


  //hooks
  const {poolStatus} = usePoolStatus(tokenA, tokenB);
  const {tokenBalances, refetchBalance} = useTokenBalances(tokenA, tokenB, poolStatus, wallet?.publicKey ?? null)

  const handleRemoveAction = async (amountLpToBurn: string) => {
    setError(null);

    if (!wallet || !wallet.publicKey) {
      setError("Wallet not connected");
      return;
    }
    if (poolStatus !== 1) {
      setError("Pool does not exist or invalid token addresses");
      return;
    }

    try {
          console.log("Removing liquidity:", { tokenA, tokenB, amountLpToBurn });
          const txSig = await handleRemoveLiquidity(
            tokenA,
            tokenB,
            Number(amountLpToBurn),
            wallet
          );
          console.log("Tx signature:", txSig);
          setTxSig(txSig);
    
          // refresh balances & pool status
          // await refetch();
          await refetchBalance()
        } catch (err: unknown) {
          console.error("Add liquidity failed:", err);
          if (err instanceof Error) setError(err.message || "Transaction failed");
          else setError(String(err) || "Transaction failed");
        }
      };


  return (
    <div className="flex flex-col items-center  min-h-[70vh] p-7">
      <h1 className="text-3xl font-bold">⚡️ MiniSwap</h1>
      
      {/* Token inputs */}
      <TokenInputs tokenA={tokenA} setTokenA={setTokenA} tokenB={tokenB} setTokenB={setTokenB} tokenBalances={tokenBalances} />

      {/* Status */}
      <PoolStatus poolStatus={poolStatus} />

      {/* Wallet not connected notice */}
      {!connected && (
        <p className="text-orange-400 mt-2">⚠️ Please connect your wallet to perform actions</p>
      )} 
      
      <div className="mt-6 w-full max-w-md">
        <RemoveLiquidityForm 
          handleRemoveAction={handleRemoveAction}
          poolStatus={poolStatus}
          tokenA={tokenA}
          tokenB={tokenB}
          tokenBalances={tokenBalances}
          walletConnected={connected}
        />
      </div>

      <ErrorLogs
        error={error}
        setError={setError}
      />

       <TxSig
          txSig={txSig}
          setTxSig={setTxSig}
        />
    </div>
  );
}