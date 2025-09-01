import { useState, useEffect, useCallback } from "react";
import { checkPoolExistsOnDevnet } from "@/lib/pool";
import { isValidSolanaTokenAddress } from "@/lib/solana";


// Status meaning:
// -1 → invalid token address
// 0  → valid but pool does not exist
// 1  → pool exists
// null → not checked yet
export function usePoolStatus(tokenA: string, tokenB: string) {
  const [poolStatus, setPoolStatus] = useState<-1 | 0 | 1 | null>(null);

  const runCheck = useCallback(async (withRetry: boolean = false) => {
      try {
        if (!tokenA || !tokenB) {
          console.log("1")
          setPoolStatus(null);
          return;
        }

        const validA = await isValidSolanaTokenAddress(tokenA);
        const validB = await isValidSolanaTokenAddress(tokenB);
        if (!validA || !validB || tokenA===tokenB) {
          console.log("2")
          setPoolStatus(-1);
          return;
        }

        let exists = false;
        for (let i = 0; i < (withRetry ? 15 : 1); i++){
          exists = await checkPoolExistsOnDevnet(tokenA, tokenB);
          if (exists) break;
          if (withRetry) await new Promise((res) => setTimeout(res, 1500)); 
        }
        setPoolStatus(exists ? 1 : 0);
      } catch (err) {
        console.error("Pool check error:", err);
        setPoolStatus(0);
      }
    }, [tokenA, tokenB]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return { poolStatus, refetchPool: () => runCheck(true) };
}
