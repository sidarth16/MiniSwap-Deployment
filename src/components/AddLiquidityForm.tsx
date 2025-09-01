"use client";

import { useEffect, useState } from "react";
import { getPoolReservesAndSupply } from "@/lib/pool";
import { estimateLpToMint } from "@/lib/estimate";
import { fromBaseUnits, sanitizeInput, toBaseUnits } from "@/utils/format";

const LP_TOKEN_DECIMALS = 9;
type PoolStatusType = -1 | 0 | 1 | null;

/* ----------------------------------------------
   Add Liquidity Form Component (with labels)
------------------------------------------------ */
export default function AddLiquidityForm({
  handleAddAction,  poolStatus,  tokenA,  tokenB, tokenBalances, walletConnected
}:{
  handleAddAction: (amountA: string, amountB: string) => void;
  poolStatus: PoolStatusType;
  tokenA: string;  tokenB: string;
  tokenBalances: {
    userBalanceTokenA: string,  userBalanceTokenB: string, userBalanceLP: string,
    vaultBalanceTokenA: string,  vaultBalanceTokenB: string
  }| null;
  walletConnected: boolean;
  }) {
    const [amountA, setAmountA] = useState('');
    const [amountB, setAmountB] = useState('');

    const [estimatedLP, setEstimatedLP] = useState<string | null>(null);
    const [lastEdited, setLastEdited] = useState<"A" | "B" | null>(null);
    const [reserves, setReserves] = useState<{
        vaultA: bigint;  vaultB: bigint;  supplyLP: bigint;
        tokenADecimals: number; tokenBDecimals: number;
    } | null>(null);

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

    // auto-fill amountB when amountA changes
    useEffect(() => {
        if (!reserves || !amountA || lastEdited !== "A") return;
        const a = BigInt(toBaseUnits(amountA,reserves.tokenADecimals));
        if (reserves.vaultA > BigInt(0) && reserves.vaultB > BigInt(0)) {
            const requiredB = fromBaseUnits( 
              (a * reserves.vaultB) / reserves.vaultA,
              reserves.tokenBDecimals
            )
            if (requiredB !== amountB) {
                setAmountB(requiredB);
            }
        }
    }, [amountA, reserves, lastEdited]);

    // auto-fill amountA when amountB changes
    useEffect(() => {
        if (!reserves || !amountB || lastEdited !== "B") return;
        const b = BigInt(toBaseUnits(amountB,reserves.tokenBDecimals));
        if (reserves.vaultA > BigInt(0) && reserves.vaultB > BigInt(0)) {
            const requiredA = fromBaseUnits( 
              (b * reserves.vaultA) / reserves.vaultB,
              reserves.tokenADecimals
            );
            if (requiredA !== amountA) {
                setAmountA(requiredA);
            }
        }
    }, [amountB, reserves, lastEdited]);

    // Estimate LP tokens to be minted
    useEffect(() => {
        try {
            if (!reserves || !amountA || !amountB) {
            setEstimatedLP(null);
            return;
            }
            const estLP = estimateLpToMint(
                reserves.vaultA, reserves.vaultB, reserves.supplyLP,
                BigInt(toBaseUnits(amountA,reserves.tokenADecimals)),
                BigInt(toBaseUnits(amountB,reserves.tokenBDecimals)),
                reserves.tokenADecimals, reserves.tokenBDecimals
            );
            setEstimatedLP(estLP);
            }
        catch (err) {
            console.error("Failed to estimate LP:", err);
            setEstimatedLP(null);
        }
    }, [amountA, amountB, reserves]);


  // Validate that input is a positive number
  const isValidAmount = (val: string) => !isNaN(Number(val)) && Number(val) > 0;
  const canSubmit = 
    (isValidAmount(amountA) &&  isValidAmount(amountB) && 
    poolStatus === 1 && estimatedLP !== null &&  Number(estimatedLP) > 0);

  
  

  if (!tokenA || !tokenB || poolStatus!==1){ 
    return(
    <div className="mt-2 p-6 rounded-2xl bg-black/10 backdrop-blur-md border border-white/20 shadow-2xl space-y-4">
      <h2 className="text-2xl font-bold text-center text-yellow-400 drop-shadow-xl">Add  Liquidity</h2>
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
    <div className="mt-10 p-6 rounded-2xl bg-black/10 backdrop-blur-md border border-white/20 shadow-2xl space-y-4">
      <h2 className="text-2xl font-bold text-yellow-400 drop-shadow-xl ">Add {reserves.vaultA === BigInt(0) || reserves?.vaultB === BigInt(0)  ? 'Initial' : ''} Liquidity</h2>

      {/* Token A */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1 text-yellow-100">Token A</label>
        <input
          type="number"
          placeholder="0.0"
          value={amountA}
          onChange={(e) => {
            const val = sanitizeInput(e.target.value, reserves.tokenADecimals);
            // // Clamp to max balance
            // const maxVal = Number(tokenBalances.userBalanceTokenA);
            // if (Number(val) > maxVal) {
            //   val = maxVal.toString();
            // }
            setAmountA(val);
            setLastEdited("A"); 

          }}
          className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
        />
        {/* {userBalanceA !== null && ( */}
        <p className="text-xs text-gray-300/70 mt-1">
          User Balance: {tokenBalances.userBalanceTokenA}
        </p>
  {/* // )} */}
      </div>

      {/* Token B */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1 text-yellow-100">Token B</label>
        <input
          type="number"
          placeholder="0.0"
          value={amountB}
          onChange={(e) => {
            const val = sanitizeInput(e.target.value, reserves.tokenBDecimals);
            // // Clamp to max balance
            // const maxVal = Number(tokenBalances.userBalanceTokenB);
            // if (Number(val) > maxVal) {
            //   val = maxVal.toString();
            // }
            setAmountB(val);
            setLastEdited("B"); 
          }}
          className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
        />
        
        {/* <p className="flex items-center gap-1 text-gray-200 text-xs mb-1"> */}
        {/* <img src="/wallet.svg" alt="Wallet" className="w-4 h-4" />{userBalanceB} Token A */}
        <p className="text-xs text-gray-300/70 mt-1">
          {/* User Balance: {fromBaseUnits(tokenBalances.userBalanceTokenB,reserves.tokenBDecimals)  } */}
          User Balance: {tokenBalances.userBalanceTokenB}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={() => handleAddAction(
          toBaseUnits(amountA, reserves.tokenADecimals).toString(), 
          toBaseUnits(amountB, reserves.tokenBDecimals).toString()
        )}
        disabled={!canSubmit || !walletConnected}
        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 hover:scale-105 transition text-white shadow-lg disabled:opacity-60"
      >
        Add Liquidity
      </button>

      {/* Estimated LP */}
      {estimatedLP && (
        <p className="text-sm text-gray-200/80">
          Estimated LP to be minted: <strong>{fromBaseUnits(BigInt(estimatedLP),LP_TOKEN_DECIMALS)}</strong>
        </p>
      )}
    {estimatedLP=='0' && (
      <p className="text-red-500 text-sm mt-1">
        ⚠️  Add more Liquidity !
      </p>
    )}
    {estimatedLP === null && amountA && amountB && (
      <p className="text-orange-500 text-sm mt-1 animate-pulse">
        Estimating LP tokens . . .
      </p>
    )}
    </div>
  );
}