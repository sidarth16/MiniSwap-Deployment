"use client";

import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

import TokenInputs from "@/components/TokenInputs";
import PoolStatus from "@/components/PoolStatus";
import AddLiquidityForm from "@/components/AddLiquidityForm";
import ErrorLogs from "@/components/ErrorLogs";
import TxSig from "@/components/TxSig";

import { usePoolStatus } from "@/hooks/usePoolStatus";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { handleAddLiquidity } from "@/lib/handlers"



export default function HomePage() {
  const wallet = useAnchorWallet();
  const connected = !!wallet?.publicKey;

  const [tokenA, setTokenA] = useState("H68y5nKjyc8ESB6dn7syQ1FWn1axU7DYDB5VE9MTAU2c");
  const [tokenB, setTokenB] = useState("7ffSz8Yyi7Zy1nLR7L7WSAUH7LcWt9uX1tMvtijD4fqX");

  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null); 
  

  //hooks
  const { poolStatus } = usePoolStatus(tokenA, tokenB);
  const {tokenBalances, refetchBalance} = useTokenBalances(tokenA, tokenB, poolStatus, wallet?.publicKey ?? null)

  const handleAddAction = async (amountA: string, amountB: string) => {
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
      console.log("Adding liquidity:", { tokenA, tokenB, amountA, amountB });
      const txSig = await handleAddLiquidity(
        tokenA,
        tokenB,
        Number(amountA),
        Number(amountB),
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
        <AddLiquidityForm 
          handleAddAction={handleAddAction} // {} with handleAction('add')
          poolStatus={poolStatus}
          tokenA={tokenA}
          tokenB={tokenB}
          tokenBalances={tokenBalances}
          walletConnected={connected}
        />
      </div>
      
      {/* <button className="mt-2 text-sm text-gray-200/80 hover:scale-105" onClick={() => refetchBalance()}>🔄 Refresh Balance</button> */}

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