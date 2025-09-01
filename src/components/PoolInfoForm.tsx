"use client";

import { useEffect, useState } from "react";

import { getPoolReservesAndSupply } from "@/lib/pool";
import { fromBaseUnits } from "@/utils/format";

type PoolStatusType = -1 | 0 | 1 | null;
const LP_TOKEN_DECIMALS = 9;

/* ----------------------------------------------
  Home Pool Info Form Component (with labels)
------------------------------------------------ */
export default function PoolInfoForm({
  poolStatus,
  tokenA,
  tokenB,
}: {
  poolStatus: PoolStatusType;
  tokenA: string;
  tokenB: string;
}) {
  const [reserves, setReserves] = useState<{
    vaultA: bigint;
    vaultB: bigint;
    supplyLP: bigint;
    tokenADecimals: number;
    tokenBDecimals: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (poolStatus === 1 && tokenA && tokenB) {
        const r = await getPoolReservesAndSupply(tokenA, tokenB);
        setReserves(r);
      }else setReserves(null);
    })();
  }, [tokenA, tokenB, poolStatus]);

  if (!tokenA || !tokenB || poolStatus!==1) return;
  if (!reserves){
      if(poolStatus===1){
        return (
          <p className="text-yellow-300/50 mt-2 animate-pulse flex justify-center text-centre"> . . . Fetching Pool Reserves . . . </p>
        );
      }
    return;
  }

  return (
    <div className="mt-4 p-6 rounded-3xl bg-black/25 backdrop-blur-lg border border-white/20 shadow-2xl space-y-6">
      <h2 className="text-2xl font-extrabold text-yellow-400 drop-shadow-lg">Pool Info</h2>
      <div className="flex flex-col gap-3">
        <InfoRow label="Vault A" value={`${fromBaseUnits(reserves.vaultA, reserves.tokenADecimals)} Tokens`} />
        <InfoRow label="Vault B" value={`${fromBaseUnits(reserves.vaultB, reserves.tokenBDecimals)} Tokens`} />
        <InfoRow label="LP Supply" value={`${fromBaseUnits(reserves.supplyLP, LP_TOKEN_DECIMALS)} Tokens`} />
        <InfoRow
          label="Decimals"
          value={
            <>
              TokenA  : 10<sup>{reserves.tokenADecimals}</sup> <br />
              TokenB  : 10<sup>{reserves.tokenBDecimals}</sup><br />
              LP : 10<sup>{LP_TOKEN_DECIMALS}</sup>

            </>
          }
        />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
      <span className="text-gray-300 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-white font-semibold truncate">{value}</span>
    </div>
  );
}
