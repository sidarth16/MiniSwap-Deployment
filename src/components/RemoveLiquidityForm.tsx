"use client";

import { useEffect, useState } from "react";
import { getPoolReservesAndSupply } from "@/lib/pool";
import { fromBaseUnits, sanitizeInput, toBaseUnits } from "@/utils/format";

const LP_TOKEN_DECIMALS = 9;

type PoolStatusType = -1 | 0 | 1 | null;

/* ----------------------------------------------
   Remove Liquidity Form Component
------------------------------------------------ */
export default function RemoveLiquidityForm(
  {handleRemoveAction, poolStatus,  tokenA,  tokenB, tokenBalances, walletConnected,}: 
  {
  handleRemoveAction: (userLPBalance: string) => void;
  poolStatus: PoolStatusType;
  tokenA: string; tokenB: string;  
  tokenBalances:{
    userBalanceTokenA: string,  userBalanceTokenB: string, userBalanceLP: string,
    vaultBalanceTokenA: string,  vaultBalanceTokenB: string
  }| null;
  walletConnected: boolean;
  }) {
    const [amountLpToBurn, setAmountLpToBurn] = useState('');
    const [estimatedTokensOut, setEstimatedTokensOut] = useState<{ amountA: bigint; amountB: bigint } | null>(null);
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
                } else setReserves(null);
            } catch (e) {
                console.error("Failed to fetch reserves:", e);
            }
        })();
    }, [tokenA, tokenB, poolStatus]);

    // Estimate LP tokens to be minted
    useEffect(() => {
      if (!reserves || !amountLpToBurn || !(reserves.supplyLP>0)) {
        setEstimatedTokensOut(null);
        return;
      }
      try {
        setEstimatedTokensOut({
         amountA: (reserves.vaultA * BigInt(toBaseUnits(amountLpToBurn,LP_TOKEN_DECIMALS))) / reserves.supplyLP,
         amountB: (reserves.vaultB * BigInt(toBaseUnits(amountLpToBurn,LP_TOKEN_DECIMALS))) / reserves.supplyLP
        })      
      } catch (err) {
        console.error("Failed to estimate LP:", err);
        setEstimatedTokensOut(null);
      }
    }, [amountLpToBurn, reserves]);


  // Validate that input is a positive number
  const isValidAmount = (val: string) => !isNaN(Number(val)) && Number(val) > 0;
  const canSubmit = isValidAmount(amountLpToBurn) && poolStatus === 1 && estimatedTokensOut;
  
  if (!tokenA || !tokenB || poolStatus!==1){ 
    return(
    <div className="mt-10 p-6 rounded-2xl bg-black/10 backdrop-blur-md border border-white/20 shadow-2xl space-y-4">
      <h2 className="text-2xl font-bold text-center text-yellow-400 drop-shadow-xl">Remove  Liquidity</h2>
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
      <div className="mt-3 p-6 rounded-2xl bg-black/10 backdrop-blur-md border border-white/20 shadow-2xl space-y-4">
        <h2 className="text-2xl font-bold text-yellow-400 drop-shadow-xl">Remove Liquidity</h2>

        {/* LP Token Amount */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1 text-yellow-100">LP Token Amount</label>
          <input
            type="number"
            placeholder="0.0"
            value={amountLpToBurn}
            onChange={(e) => {
                let val = sanitizeInput(e.target.value, LP_TOKEN_DECIMALS);

                // Clamp to max balance
                const maxVal = Number(tokenBalances.userBalanceLP);
                if (Number(val) > maxVal) {
                  val = maxVal.toString();
                }

                setAmountLpToBurn(val);
              } 
            }
            className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
            max={Number(tokenBalances.userBalanceLP)}
          />
          <p className="text-xs text-gray-300/70 mt-1">
            User LP Balance: {tokenBalances.userBalanceLP}
          </p>
          {/* <p className="text-xs text-gray-300/70 mt-1">
            User TokenA Balance: {tokenBalances.userBalanceTokenA}
          </p>
          <p className="text-xs text-gray-300/70 mt-1">
            User tokenB Balance: {tokenBalances.userBalanceTokenB}
          </p> */}
        </div>

        {/* Button */}
        <button
          onClick={() => {
              handleRemoveAction(toBaseUnits(amountLpToBurn, LP_TOKEN_DECIMALS).toString());
              setAmountLpToBurn('');
            }
          }
          disabled={!canSubmit || !walletConnected}
          className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 transition text-white shadow-lg disabled:opacity-60"
        >
          Burn LP
        </button>

        {/* Estimated token amounts */}
        {canSubmit && (
          <div className="text-sm mt-2 text-gray-200/80 ">
            {/* <p>Estimated Token A: <strong>{estimatedTokensOut.amountA}</strong></p>
            <p>Estimated Token B: <strong>{estimatedTokensOut.amountB}</strong></p> */}
            <p>Estimated amounts you will receive:</p>
            <ul className="ml-0 space-y-1 marker:text-yellow-400">
              <li>Token A: <strong>{fromBaseUnits(estimatedTokensOut.amountA, reserves.tokenADecimals)}</strong></li>
              <li>Token B: <strong>{fromBaseUnits(estimatedTokensOut.amountB, reserves.tokenBDecimals)}</strong></li>
            </ul>
          </div>
        )}
        {estimatedTokensOut === null && Number(amountLpToBurn) > 0 && (
          <p className="text-red-500 text-sm mt-1">
            {/* ⚠️ Invalid LP amount */}
            {reserves?.vaultA === BigInt(0) || reserves?.vaultB === BigInt(0)
            ? 'Initial Liquidity not yet provided ! '
            : 'Estimating Token Amounts . . .'}
          </p>
        )}
      </div>
    );

}