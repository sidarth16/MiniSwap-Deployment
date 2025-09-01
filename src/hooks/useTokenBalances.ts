import { useState, useEffect, useCallback } from "react";
import type{PublicKey } from "@solana/web3.js";

import { getUserTokenBalances } from "@/lib/pool";

type PoolStatusType = -1 | 0 | 1 | null;


export function useTokenBalances(
  tokenA: string, tokenB: string, poolStatus:PoolStatusType, walletPubkey: PublicKey|null
){
  const [tokenBalances, setTokenBalances] = useState<{
    userBalanceTokenA: string;  userBalanceTokenB: string; userBalanceLP: string;
    vaultBalanceTokenA: string;  vaultBalanceTokenB: string;
  } | null>(null);

  const fetchBalance = useCallback(async () => {
      try {
        console.log("Fetching Balance")
        if (!tokenA || !tokenB || !walletPubkey || poolStatus!==1) {
          setTokenBalances(null);
          return;
        }

        console.log("calling getUserTokenBalances ")
        const bal = await getUserTokenBalances(tokenA, tokenB, walletPubkey);
        console.log("bal : ", bal)
        if (bal) {
          setTokenBalances(bal);
          return;
        }
      } catch (err) {
        console.error("Retrive userbalance error:", err);
        setTokenBalances(null);
      }
    },[tokenA, tokenB, walletPubkey, poolStatus]) ;

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { tokenBalances, refetchBalance: () => fetchBalance() }
}
