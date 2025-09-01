"use client";

import { useEffect, useState } from "react";

import { getPoolReservesAndSupply } from "@/lib/pool";
import { estimateSwappedTokenOut } from "@/lib/estimate";
import { fromBaseUnits, sanitizeInput, toBaseUnits } from "@/utils/format";


type PoolStatusType = -1 | 0 | 1 | null;

/* ----------------------------------------------
   Swap Liquidity Form Component (with labels)
------------------------------------------------ */
export default function SwapForm(
    { 
      handleSwapAction,  poolStatus,  tokenA,  tokenB, tokenBalances, walletConnected
    }: 
    {
      handleSwapAction: (amountSwapIn: string, amountSwapOut: string, inputToken: string) => void;
      poolStatus: PoolStatusType;
      tokenA: string;  tokenB: string;
      tokenBalances: {
        userBalanceTokenA: string,  userBalanceTokenB: string, userBalanceLP: string,
        vaultBalanceTokenA: string,  vaultBalanceTokenB: string
      }| null;
      walletConnected: boolean;
    }
  ) {

    const [amountSwapIn, setAmountSwapIn] = useState('');
    const [tokenSwapIn, setTokenSwapIn] = useState(tokenA);
    const [amountMinSwapOut, setAmountMinSwapOut] = useState('');

    const [estimatedTokensOut, setEstimatedTokensOut] = useState< string | null>(null);
    const [reserves, setReserves] = useState<{
        vaultA: bigint;  vaultB: bigint;  supplyLP: bigint;
        tokenADecimals: number; tokenBDecimals: number;
    } | null>(null);

    // Set default if input tokens change
    useEffect(() => {
      if (tokenA) {
        setTokenSwapIn(tokenA);
      }
      setAmountSwapIn('')
      setAmountMinSwapOut('')
    }, [tokenA, tokenB]);

    useEffect(() => {
        (async () => {
            try{
                if (poolStatus === 1 && tokenA && tokenB) {
                    const r = await getPoolReservesAndSupply(tokenA, tokenB);
                    setReserves(r);
                }else setReserves(null);
            } catch (e) {
                console.error("Failed to fetch reserves:", e);
            }
        })();
    }, [tokenA, tokenB, poolStatus]);

    // Estimate Swap Tokens Out
    useEffect(() => {
      if (!reserves || !amountSwapIn) {
        setEstimatedTokensOut(null);
        return;
      }
      try {
        if (tokenSwapIn === tokenA){
            const estAmtOut = estimateSwappedTokenOut(
              reserves.vaultA, reserves.vaultB,
              BigInt(toBaseUnits(amountSwapIn, reserves.tokenADecimals))
            );
            if (estAmtOut > 0){
              setEstimatedTokensOut(fromBaseUnits(estAmtOut, reserves.tokenBDecimals));
            }
        }
        if (tokenSwapIn === tokenB){
            const estAmtOut = estimateSwappedTokenOut(
              reserves.vaultB, reserves.vaultA,
              BigInt(toBaseUnits(amountSwapIn, reserves.tokenBDecimals))
            );
            if (estAmtOut > 0){
              setEstimatedTokensOut(fromBaseUnits(estAmtOut, reserves.tokenADecimals));
            }
        }
      } catch (err) {
        console.error("Failed to estimate LP:", err);
        setEstimatedTokensOut(null);
      }
    }, [amountSwapIn, reserves, tokenSwapIn]);

    // console.log('tokenSwapIn :' ,tokenSwapIn);

    // Validate that input is a positive number
    const isValidAmount = (val: string) => !isNaN(Number(val)) && Number(val) > 0;
    const canSubmit =
      isValidAmount(amountSwapIn) && isValidAmount(amountMinSwapOut) &&
      poolStatus === 1 && estimatedTokensOut;

   if (!tokenA || !tokenB || poolStatus!==1){ 
    return(
    <div className="mt-10 p-6 rounded-2xl bg-black/10 backdrop-blur-md border border-white/20 shadow-2xl space-y-4">
      <h2 className="text-2xl font-bold text-center text-yellow-400 drop-shadow-xl">Swap Tokens</h2>
    </div>
    );
  }
  if (!reserves || !tokenBalances){
      if(poolStatus===1){
        return(
            <p className="text-yellow-300/50 mt-2 animate-pulse flex justify-center text-centre"> . . . Fetching Pool Reserves . . . </p>
        );
      }
    return;
  }
    
    return (
      <div className="mt-2 p-6 rounded-2xl bg-black/10 backdrop-blur-md border border-white/20 shadow-2xl space-y-4">
        <h2 className="text-2xl font-bold text-yellow-400 drop-shadow-xl">Swap Tokens</h2>

        {/* Amount In */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1 text-yellow-100">Amount In <strong>({tokenSwapIn === tokenA ? 'Token A' : 'Token B'})</strong></label>
          <input
            type="number"
            placeholder="0.0"
            className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
            value={amountSwapIn}
            onChange={(e) => {
              const swapInDecimals = (tokenSwapIn === tokenA) ? reserves.tokenADecimals : reserves.tokenBDecimals ;
              setAmountSwapIn( sanitizeInput( e.target.value, swapInDecimals) )}
            }
          />
          <p className="text-xs text-gray-300/70 mt-1">
            User Balance: {tokenSwapIn === tokenA ? tokenBalances.userBalanceTokenA : tokenBalances.userBalanceTokenB}
          </p>
        </div>

        {/* Swap Direction */}
        {/* <p className="text-center -mt-3 mb-1 text-lg ">↓</p> */}

        <div className="relative w-full my-2 flex justify-center">
        <button
            onClick={() => setTokenSwapIn(tokenSwapIn === tokenA ? tokenB : tokenA)}
            className="flex items-center justify-center w-12 h-10 py-3 rounded-full text-center hover:scale-105 bg-white/10 hover:bg-white/20 transition-transform shadow-lg disabled:opacity-50"
            disabled={!tokenA || !tokenB}
        >
          <img src={"/toggle.svg"} alt="Toggle Tokens" className="w-7 h-7 drop-shadow-md" />
        </button>
        </div>


        {/* Estimated Output */}
        <div className="flex flex-col">
          <label className="text-sm font-medium -mt-3 mb-1 text-yellow-100">Amount Out <strong>({tokenSwapIn === tokenA ? 'Token B' : 'Token A'})</strong></label>
          <input 
            type="number"
            placeholder="0.0"
            className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full disabled:opacity-70"
            value={estimatedTokensOut?.toString() || ''}
            disabled
          />
          <p className="text-xs text-gray-300/70 mt-1">
            User Balance: {tokenSwapIn === tokenA ? tokenBalances.userBalanceTokenB : tokenBalances.userBalanceTokenA}
          </p>
        </div>
        
        {/* Min Amount Out */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1 text-yellow-100">Min Amount Out</label>
          <input
            type="number"
            placeholder="0.0"
            className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
            value={amountMinSwapOut}
            onChange={(e) => {
              const swapInDecimals = (tokenSwapIn === tokenA) ? reserves.tokenBDecimals : reserves.tokenADecimals ;
              setAmountMinSwapOut( sanitizeInput( e.target.value, swapInDecimals) )}
            }
          />
        </div>

        {/* Button */}
        <div className="flex flex-row gap-2">

          <button
            onClick={() => {
              const swapInDecimals = (tokenSwapIn === tokenA) ? reserves.tokenADecimals : reserves.tokenBDecimals ;
              const swapOutDecimals = (tokenSwapIn === tokenA) ? reserves.tokenBDecimals : reserves.tokenADecimals ;
              handleSwapAction(
                toBaseUnits(amountSwapIn, swapInDecimals).toString(),
                toBaseUnits(amountMinSwapOut, swapOutDecimals).toString(),
                tokenSwapIn
              )
            }}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-green-600 to-teal-500 hover:scale-105 hover:bg-green-600/20 transition text-white shadow-lg disabled:opacity-65"
            disabled={!canSubmit || !walletConnected}
          >
            Swap
          </button>

          {/* <button
            onClick={() => setTokenSwapIn(tokenSwapIn === tokenA ? tokenB : tokenA)}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 hover:scale-105 transition text-white shadow-lg disabled:opacity-50"
            disabled={!tokenA || !tokenB}
          >
            Toggle Tokens
          </button> */}
        </div>
      </div>
    );
}