"use client";

import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

import TokenInputs from "@/components/TokenInputs";
import PoolStatus from "@/components/PoolStatus";
import PoolInfoForm from "@/components/PoolInfoForm";
import ErrorLogs from "@/components/ErrorLogs";
import TxSig from "@/components/TxSig";

import { usePoolStatus } from "@/hooks/usePoolStatus";
import { useTokenBalances } from "@/hooks/useTokenBalances";

import { handleInitPool } from "@/lib/handlers"


export default function HomePage() {
  const wallet = useAnchorWallet();
  const connected = !!wallet?.publicKey;

  const [tokenA, setTokenA] = useState("H68y5nKjyc8ESB6dn7syQ1FWn1axU7DYDB5VE9MTAU2c");
  const [tokenB, setTokenB] = useState("6v1CkZ2w3uybFfkGf5pNE7SWV2QDL6ok5Z8U6Tpa311o");

  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null); 
  
  //hooks
  const { poolStatus, refetchPool } = usePoolStatus(tokenA, tokenB);
  const { tokenBalances, refetchBalance} = useTokenBalances(tokenA, tokenB, poolStatus, wallet?.publicKey ?? null)

  const handleInitAction = async () => {
    setError(null);

    if (!wallet || !wallet.publicKey) {
      setError('Wallet not connected');
      return;
    }

    try {
      console.log("Initializing Pool:", { tokenA, tokenB});
      const txSig = await handleInitPool( tokenA, tokenB, wallet );
      console.log("Tx signature:", txSig);
      setTxSig(txSig);

      // await connection.confirmTransaction(txSig, "confirmed");
      // ✅ refresh status after tx
      await refetchPool(); 
      await refetchBalance();
    } 
    catch (err: unknown) {
      console.error("InitPool failed:", err);
      if (err instanceof Error) setError(err.message || 'Transaction failed');
      setError(String(err) || 'Transaction failed');
    }
  }

  return (
    <div className="flex flex-col items-center  min-h-[70vh] p-7">
      <h1 className="text-3xl font-bold">⚡️ MiniSwap</h1>
      
      {/* Token inputs */}
      <TokenInputs tokenA={tokenA} setTokenA={setTokenA} tokenB={tokenB} setTokenB={setTokenB} tokenBalances={tokenBalances} />
      
      {/* Status */}
      <PoolStatus poolStatus={poolStatus} />
      
      {/* Init Pool */}
      {poolStatus==0 && 
        <div className="flex flex-col sm:flex-row gap-4 mt-20 w-full max-w-xl">
      
          <button 
            onClick={() => handleInitAction()}
            disabled={!connected}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500/80 via-purple-500/80 to-blue-500/80 
           hover:from-yellow-400 hover:via-pink-400 hover:to-purple-500
           text-black font-bold rounded-2xl shadow-2xl transition-all border border-yellow"
          >
            Create Pool
          </button>
        </div>
      }

      <div className="mt-6 w-full max-w-md">
        <PoolInfoForm poolStatus={poolStatus} tokenA={tokenA} tokenB={tokenB} />
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
