'use client';
import { useState, useEffect } from 'react';
import { useAnchorWallet } from "@solana/wallet-adapter-react";

import {getPoolReservesAndSupply, isValidSolanaTokenAddress, checkPoolOnDevnet} from "@/lib/solana/utils"
// import {estimateLpToMint, estimateWithdrawTokenAmounts, estimateSwappedTokenOut} from "@/lib/solana/estimate"
// import { handleInitPool, handleAddLiquidity, handleRemoveLiquidity, handleSwapTokens} from "@/lib/solana/handlers"

import { useSearchParams } from "next/navigation";

/* ----------------------------------------------
   Token Inputs Component
------------------------------------------------ */
function TokenInputs({ tokenA, setTokenA, tokenB, setTokenB }: {
  tokenA: string; setTokenA: (v: string) => void;
  tokenB: string; setTokenB: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full max-w-3xl">
      <div className="flex flex-col flex-1">
        <label className="text-sm font-medium mb-1 text-yellow-200 text-center">Token A</label>
        <input
          type="text"
          placeholder="Address Token A"
          value={tokenA}
          onChange={(e) => setTokenA(e.target.value)}
          className="w-full p-3 rounded-3xl bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:ring-2 focus:ring-yellow-400"
        />
      </div>
      <div className="flex flex-col flex-1">
        <label className="text-sm font-medium mb-1 text-yellow-200 text-center">Token B</label>
        <input
          type="text"
          placeholder="Address Token B"
          value={tokenB}
          onChange={(e) => setTokenB(e.target.value)}
          className="w-full p-3 rounded-3xl bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:ring-2 focus:ring-yellow-400"
        />
      </div>
    </div>
  );
}


/* ----------------------------------------------
   Status Component (minimal, no box)
------------------------------------------------ */
function PoolStatus({ poolStatus }: { poolStatus: -1 | 0 | 1 | null }) {
  if (poolStatus === -1)
    return <p className="mt-4 text-center text-red-500 font-semibold">⚠️ Invalid Token Address</p>;

  if (poolStatus === 0)
    return <p className="mt-4 text-center text-yellow-600 font-semibold">⚠️ Pool does not exist for these tokens</p>;

  if (poolStatus === 1)
    return <p className="mt-4 text-center text-green-600 font-semibold">✅ Pool exists</p>;

  return null;
}


/* ----------------------------------------------
  Home Pool Info Form Component (with labels)
------------------------------------------------ */
// function HomeInfoForm({poolStatus,  tokenA,  tokenB}: {poolStatus: -1 | 0 | 1 | null; tokenA: string; tokenB: string;}) {
//   const [reserves, setReserves] = useState<{ vaultA: bigint; vaultB: bigint; supplyLP: bigint; tokenADecimals:number; tokenBDecimals: number; } | null>(null);

//   console.log("Rendering Home Form!");
//   // Fetch reserves
//   useEffect(() => {
//     (async () => {
//       try {
//         if (poolStatus == 1){
//           const r = await getPoolReservesAndSupply(tokenA, tokenB);
//           console.log("Reserves fetched : ");
//           setReserves(r);
//         }
//       } catch (e) {
//         console.error("Failed to fetch reserves:", e);
//       }
//     })();
//   }, [tokenA, tokenB, poolStatus]);
//   // if (!reserves?.tokenADecimals || !reserves?.tokenBDecimals){
//   //   return (<div>Loading Home...</div>)
//   // }

//   return (
//     <div>
//     {poolStatus === 1 && reserves && (
//     <div className="mt-4 p-6 rounded-3xl bg-black/25 backdrop-blur-lg border border-white/20 shadow-2xl space-y-6">
//         <h2 className="text-2xl font-extrabold text-yellow-400 drop-shadow-lg">Pool Info</h2>
//         <div className="flex flex-col gap-3">  
//           {/* Vault A */}
//           <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
//             <span className="text-gray-300 font-medium uppercase tracking-wide">Vault A</span>
//             <span className="text-white font-semibold truncate">{reserves?.vaultA} Tokens</span>
//           </div>

//           {/* Vault B */}
//           <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
//             <span className="text-gray-300 font-medium uppercase tracking-wide">Vault B</span>
//             <span className="text-white font-semibold truncate">{reserves?.vaultB} Tokens</span>
//           </div>

//           {/* LP Supply */}
//           <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
//             <span className="text-gray-300 font-medium uppercase tracking-wide">LP Supply</span>
//             <span className="text-white font-semibold truncate">{reserves?.supplyLP} Tokens</span>
//           </div>

//           {/* Decimals */}
//           <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
//             <span className="text-gray-300 font-medium uppercase tracking-wide">Decimals</span>
//             <span className="text-white font-semibold">
//               TokenA : 10<sup>{reserves.tokenADecimals}</sup> <br/>
//               TokenB : 10<sup>{reserves.tokenBDecimals}</sup>
//             </span>
//           </div>
//         </div>
//     </div>
//     )} 
//     </div>
//   )
// }

  
/* ----------------------------------------------
   Add Liquidity Form Component (with labels)
------------------------------------------------ */
// function AddLiquidityForm(
//   {handleAction,  poolStatus,  tokenA,  tokenB,  amountA,  setAmountA,  amountB,  setAmountB,  disabled,}: 
//   {
//   handleAction: (action: 'add') => void;
//   poolStatus: -1 | 0 | 1 | null;
//   tokenA: string;
//   tokenB: string;
//   amountA: string;
//   setAmountA: (v: string) => void;
//   amountB: string;
//   setAmountB: (v: string) => void;
//   disabled: boolean;
//   }) {
//   const [estimatedLP, setEstimatedLP] = useState<string | null>(null);
//   const [reserves, setReserves] = useState<{ vaultA: bigint; vaultB: bigint; supplyLP: bigint; tokenADecimals:number; tokenBDecimals: number; } | null>(null);
//   const [lastEdited, setLastEdited] = useState<"A" | "B" | null>(null);

//   // handlers
//   const handleAmountAChange = (val: string) => {
//     setAmountA(val);
//     setLastEdited("A");
//   };

//   const handleAmountBChange = (val: string) => {
//     setAmountB(val);
//     setLastEdited("B");
//   };

//   // Fetch reserves
//   useEffect(() => {
//     (async () => {
//       try {
//         if (poolStatus == 1){
//           const r = await getPoolReservesAndSupply(tokenA, tokenB);
//           console.log("Reserves fetched : ");
//           setReserves(r);
//         }
//       } catch (e) {
//         console.error("Failed to fetch reserves:", e);
//       }
//     })();
//   }, [tokenA, tokenB, poolStatus]);

//   // auto-fill amountB when amountA changes
//   useEffect(() => {
//     if (!reserves || !amountA || lastEdited !== "A") return;
//     const a = BigInt(amountA);
//     if (reserves.vaultA > BigInt(0) && reserves.vaultB > BigInt(0)) {
//       const requiredB = (a * reserves.vaultB) / reserves.vaultA;
//       if (requiredB.toString() !== amountB) {
//         setAmountB(requiredB.toString());
//       }
//     }
//   }, [amountA, reserves, lastEdited]);

//   // auto-fill amountA when amountB changes
//   useEffect(() => {
//     if (!reserves || !amountB || lastEdited !== "B") return;
//     const b = BigInt(amountB);
//     if (reserves.vaultA > BigInt(0) && reserves.vaultB > BigInt(0)) {
//       const requiredA = (b * reserves.vaultA) / reserves.vaultB;
//       if (requiredA.toString() !== amountA) {
//         setAmountA(requiredA.toString());
//       }
//     }
//   }, [amountB, reserves, lastEdited]);

//   // Estimate LP tokens to be minted
//   useEffect(() => {
//     if (!reserves || !amountA || !amountB) {
//       setEstimatedLP(null);
//       return;
//     }

//     try {
//       console.log("Estimating LP \n  reserves.decimalA: ",reserves.tokenADecimals)
//       const estLP = estimateLpToMint(
//         reserves.vaultA, reserves.vaultB, reserves.supplyLP,
//         BigInt(amountA), BigInt(amountB),
//         reserves.tokenADecimals, reserves.tokenBDecimals
//       );
//       setEstimatedLP(estLP.toString());
//     } catch (err) {
//       console.error("Failed to estimate LP:", err);
//       setEstimatedLP(null);
//     }
//   }, [amountA, amountB, reserves]);

  
//   // Validate that input is a positive number
//   const isValidAmount = (val: string) => !isNaN(Number(val)) && Number(val) > 0;
//   const canSubmit = 
//     isValidAmount(amountA) && 
//     isValidAmount(amountB) && 
//     poolStatus === 1 &&
//     estimatedLP !== null &&
//     Number(estimatedLP) > 0;


//   return (
//     <div className="mt-2 p-6 rounded-2xl bg-black/10 backdrop-blur-md border border-white/20 shadow-2xl space-y-4">
//       <h2 className="text-2xl font-bold text-yellow-400 drop-shadow-xl">Add {reserves?.vaultA === BigInt(0) || reserves?.vaultB === BigInt(0)  ? 'Initial' : ''} Liquidity</h2>

//       {/* Token A */}
//       <div className="flex flex-col">
//         <label className="text-sm font-medium mb-1 text-yellow-100">Amount Token A</label>
//         <input
//           type="number"
//           placeholder="e.g. 100"
//           value={amountA}
//           onChange={(e) => handleAmountAChange(e.target.value)}
//           className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
//         />
//       </div>

//       {/* Token B */}
//       <div className="flex flex-col">
//         <label className="text-sm font-medium mb-1 text-yellow-100">Amount Token B</label>
//         <input
//           type="number"
//           placeholder="e.g. 200"
//           value={amountB}
//           onChange={(e) => handleAmountBChange(e.target.value)}
//           className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
//         />
//       </div>

//       {/* Button */}
//       <button
//         onClick={() => handleAction('add')}
//         disabled={!canSubmit || disabled}
//         className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 hover:scale-105 transition text-white shadow-lg disabled:opacity-60"
//       >
//         Add Liquidity
//       </button>

//       {/* Estimated LP */}
//       {estimatedLP && (
//         <p className="text-sm text-gray-200/80">
//           Estimated LP to be minted: <strong>{estimatedLP}</strong>
//         </p>
//       )}
//     {estimatedLP === "0" && (
//       <p className="text-red-500 text-sm mt-1">
//         ⚠️ Estimated LP to be minted is 0. Increase token amounts!
//       </p>
//     )}
//     {estimatedLP === null && (
//       <p className="text-orange-500 text-sm mt-1">
//         Estimating LP tokens . . .
//       </p>
//     )}
//     </div>
//   );
// }

/* ----------------------------------------------
  Remove Liquidity Form Component (with labels)
------------------------------------------------ */
// function RemoveLiquidityForm({handleAction,  poolStatus,  tokenA,  tokenB,  amountLP,  setAmountLP,  disabled,}: {
//   handleAction: (action: 'remove') => void;
//   poolStatus: -1 | 0 | 1 | null;
//   tokenA: string;
//   tokenB: string;
//   amountLP: string;
//   setAmountLP: (v: string) => void;
//   disabled: boolean;
// }) {
//   const [reserves, setReserves] = useState<{ vaultA: bigint; vaultB: bigint; supplyLP: bigint; tokenADecimals:number; tokenBDecimals: number; } | null>(null);
//   const [estimatedTokens, setEstimatedTokens] = useState<{ amountA: bigint; amountB: bigint } | null>(null);

//   // Fetch reserves
//   useEffect(() => {
//     (async () => {
//       try {
//         if (poolStatus == 1){
//           const r = await getPoolReservesAndSupply(tokenA, tokenB);
//           console.log("Reserves fetched : ");
//           setReserves(r);
//         }
//       } catch (e) {
//         console.error("Failed to fetch reserves:", e);
//       }
//     })();
//   }, [tokenA, tokenB, poolStatus]);

//   // Estimate LP tokens to be minted
//   useEffect(() => {
//     if (!reserves || !amountLP || !(reserves.supplyLP>0)) {
//       setEstimatedTokens(null);
//       return;
//     }
//     try {
//       const estAmts = estimateWithdrawTokenAmounts(
//         reserves.vaultA,
//         reserves.vaultB,
//         reserves.supplyLP,
//         BigInt(amountLP)
//       );
//       setEstimatedTokens(estAmts);
//     } catch (err) {
//       console.error("Failed to estimate LP:", err);
//       setEstimatedTokens(null);
//     }
//   }, [amountLP, reserves]);

//   // Validate that input is a positive number
//   const isValidAmount = (val: string) => !isNaN(Number(val)) && Number(val) > 0;
//   const canSubmit = isValidAmount(amountLP) && poolStatus === 1 && estimatedTokens;

//   return (
//     <div className="mt-3 p-6 rounded-2xl bg-black/10 backdrop-blur-md border border-white/20 shadow-2xl space-y-4">
//       <h2 className="text-2xl font-bold text-yellow-400 drop-shadow-xl">Remove Liquidity</h2>

//       {/* LP Token Amount */}
//       <div className="flex flex-col">
//         <label className="text-sm font-medium mb-1 text-yellow-100">LP Token Amount</label>
//         <input
//           type="number"
//           placeholder="e.g. 50"
//           value={amountLP}
//           onChange={(e) => setAmountLP(e.target.value)}
//           className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
//         />
//       </div>

//       {/* Button */}
//       <button
//         onClick={() => handleAction('remove')}
//         disabled={!canSubmit || disabled}
//         className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 transition text-white shadow-lg disabled:opacity-60"
//       >
//         Burn LP
//       </button>

//       {/* Estimated token amounts */}
//       {estimatedTokens &&  Number(amountLP) > 0 && (
//         <div className="text-sm mt-2 text-gray-200/80 ">
//           <p>Estimated Token A: <strong>{estimatedTokens.amountA}</strong></p>
//           <p>Estimated Token B: <strong>{estimatedTokens.amountB}</strong></p>
//         </div>
//       )}
//       {estimatedTokens === null && Number(amountLP) > 0 && (
//         <p className="text-red-500 text-sm mt-1">
//           {/* ⚠️ Invalid LP amount */}
//           {reserves?.vaultA === BigInt(0) || reserves?.vaultA === BigInt(0)  ? 'Initial Liquidity not yet provided ! ' : 'Estimating Token Amounts . . .'}
//         </p>
//       )}
//     </div>
//   );
// }


/* ----------------------------------------------
  Swap Tokens Form Component (styled)
------------------------------------------------ */
// function SwapTokensForm({handleAction,  poolStatus,  tokenA,  tokenB,  amountSwapIn,  setAmountSwapIn,  tokenSwapIn,  setTokenSwapIn,  amountMinSwapOut,  setAmountMinSwapOut,  disabled,}: {
//   handleAction: (action: 'swap') => void;
//   poolStatus: -1 | 0 | 1 | null;
//   tokenA: string;
//   tokenB: string;
//   amountSwapIn: string;
//   setAmountSwapIn: (v: string) => void;
//   tokenSwapIn:string;
//   setTokenSwapIn: (v: string) => void;
//   amountMinSwapOut: string;
//   setAmountMinSwapOut: (v: string) => void;
//   disabled: boolean;
// }) {
//   const [reserves, setReserves] = useState<{ vaultA: bigint; vaultB: bigint; supplyLP: bigint; tokenADecimals:number; tokenBDecimals: number; } | null>(null);
//   const [estimatedTokensOut, setEstimatedTokensOut] = useState< bigint | null>(null);

//   // Fetch reserves
//   useEffect(() => {
//     (async () => {
//       try {
//         if (poolStatus == 1){
//           const r = await getPoolReservesAndSupply(tokenA, tokenB);
//           console.log("Reserves fetched : ");
//           setReserves(r);
//         }
//       } catch (e) {
//         console.error("Failed to fetch reserves:", e);
//       }
//     })();
//   }, [tokenA, tokenB, poolStatus]);

//   // Estimate LP tokens to be minted
//   useEffect(() => {
//     if (!reserves || !amountSwapIn) {
//       setEstimatedTokensOut(null);
//       return;
//     }
//     try {
//       if (tokenSwapIn === tokenA){
//           const estAmts = estimateSwappedTokenOut(
//             reserves.vaultA,
//             reserves.vaultB,
//             BigInt(amountSwapIn)
//           );
//           if (estAmts > 0){
//             setEstimatedTokensOut(estAmts);
//           }
//       }
//       if (tokenSwapIn === tokenB){
//           const estAmts = estimateSwappedTokenOut(
//             reserves.vaultB,
//             reserves.vaultA,
//             BigInt(amountSwapIn)
//           );
//           if (estAmts > 0){
//             setEstimatedTokensOut(estAmts);
//           }
//       }
//     } catch (err) {
//       console.error("Failed to estimate LP:", err);
//       setEstimatedTokensOut(null);
//     }
//   }, [amountSwapIn, reserves, tokenSwapIn]);

//   // Validate that input is a positive number
//   const isValidAmount = (val: string) => !isNaN(Number(val)) && Number(val) > 0;
//   const canSubmit =
//     isValidAmount(amountSwapIn) &&
//     isValidAmount(amountMinSwapOut) &&
//     poolStatus === 1 &&
//     estimatedTokensOut;

//   return (
//     <div className="mt-2 p-6 rounded-2xl bg-black/10 backdrop-blur-md border border-white/20 shadow-2xl space-y-4">
//       <h2 className="text-2xl font-bold text-yellow-400 drop-shadow-xl">Swap Tokens</h2>

//       {/* Amount In */}
//       <div className="flex flex-col">
//         <label className="text-sm font-medium mb-1 text-yellow-100">Amount In <strong>({tokenSwapIn === tokenA ? 'Token A' : 'Token B'})</strong></label>
//         <input
//           type="number"
//           placeholder="e.g. 100"
//           className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
//           value={amountSwapIn}
//           onChange={(e) => setAmountSwapIn(e.target.value)}
//         />
//       </div>

//       {/* Swap Direction */}
//       <p className="text-center -mt-3 mb-3 text-lg ">↓</p>

//       {/* Estimated Output */}
//       <div className="flex flex-col">
//         <label className="text-sm font-medium -mt-3 mb-1 text-yellow-100">Amount Out <strong>({tokenSwapIn === tokenA ? 'Token B' : 'Token A'})</strong></label>
//         <input 
//           type="number"
//           placeholder="e.g. 100"
//           className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full disabled:opacity-70"
//           value={estimatedTokensOut?.toString() || ''}
//           disabled
//         />
//       </div>
      
//       {/* Min Amount Out */}
//       <div className="flex flex-col">
//         <label className="text-sm font-medium mb-1 text-yellow-100">Min Amount Out</label>
//         <input
//           type="number"
//           placeholder="e.g. 95"
//           className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 w-full"
//           value={amountMinSwapOut}
//           onChange={(e) => setAmountMinSwapOut(e.target.value)}
//         />
//       </div>

//       {/* Button */}
//       <div className="flex flex-row gap-2">
//         <button
//           onClick={() => handleAction('swap')}
//           className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-green-600 to-teal-500 hover:scale-105 transition text-white shadow-lg disabled:opacity-65"
//           disabled={!canSubmit || disabled}
//         >
//           Swap
//         </button>

//         <button
//           onClick={() => setTokenSwapIn(tokenSwapIn === tokenA ? tokenB : tokenA)}
//           className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 hover:scale-105 transition text-white shadow-lg disabled:opacity-50"
//           disabled={disabled}
//         >
//           Toggle Swap
//         </button>
//       </div>
//     </div>
//   );
// }

/* ----------------------------------------------
  Action Forms Component
------------------------------------------------ */
function ActionForms({
  activeForm,
  // handleAction,
  tokenA,
  tokenB,
  poolStatus,
  amountA,
  setAmountA,
  amountB,
  setAmountB,
  amountLP,
  setAmountLP,
  amountSwapIn,
  setAmountSwapIn,
  tokenSwapIn,
  setTokenSwapIn,
  amountMinSwapOut,
  setAmountMinSwapOut,
  walletConnected,
}: {
  activeForm: 'home' | 'add' | 'remove' | 'swap' | null;
  // handleAction: (action: 'add' | 'remove' | 'swap' | 'init') => void;
  poolStatus: -1 | 0 | 1 | null;
  tokenA: string;
  tokenB: string;
  amountA: string;
  setAmountA: (v: string) => void;
  amountB: string;
  setAmountB: (v: string) => void;
  amountLP: string;
  setAmountLP: (v: string) => void;
  amountSwapIn: string;
  setAmountSwapIn: (v: string) => void;
  amountMinSwapOut: string;
  tokenSwapIn:string;
  setTokenSwapIn:(v: string) => void;
  setAmountMinSwapOut: (v: string) => void;
  walletConnected: boolean;
}) {
  
  const disabled = !walletConnected;

  return (
    <div className="mt-6 w-full max-w-md">
      {
        activeForm === 'add' && poolStatus===1 && 
          <div>AddLiquidityForm</div>
        
        // <AddLiquidityForm handleAction={() => handleAction('add')}
        //   poolStatus={poolStatus}
        //   tokenA={tokenA}
        //   tokenB={tokenB}
        //   amountA={amountA}
        //   setAmountA={setAmountA}
        //   amountB={amountB}
        //   setAmountB={setAmountB} 
        //   disabled={disabled}
        // />
      }

      {activeForm === 'remove' && poolStatus===1 &&
        <div>RemoveLiquidityForm</div>
        // <RemoveLiquidityForm handleAction={() => handleAction('remove')}
        //   poolStatus={poolStatus}
        //   tokenA={tokenA}
        //   tokenB={tokenB}
        //   amountLP={amountLP}
        //   setAmountLP={setAmountLP}
        //   disabled={disabled}
        // />
      }

      {activeForm === 'swap'  && poolStatus===1 && (
         <div>SwapTokensForm</div>
        // <SwapTokensForm handleAction={() => handleAction('swap')}
        //   poolStatus={poolStatus}
        //   tokenA={tokenA}
        //   tokenB={tokenB}
        //   amountSwapIn={amountSwapIn}
        //   setAmountSwapIn={setAmountSwapIn}
        //   tokenSwapIn={tokenSwapIn}
        //   setTokenSwapIn={setTokenSwapIn}
        //   amountMinSwapOut={amountMinSwapOut}
        //   setAmountMinSwapOut={setAmountMinSwapOut}
        //   disabled={disabled}
        // />
      )}

      {activeForm === 'home' && poolStatus===1 &&
        <div>HomeInfoForm</div>
        // <HomeInfoForm 
        //   poolStatus={poolStatus}
        //   tokenA={tokenA}
        //   tokenB={tokenB}
        // />
      }

    </div>
  );
}


// "use client";
// export const dynamic = 'force-dynamic';
/* ----------------------------------------------
  Home Page Component
------------------------------------------------ */
export default function HomePage() {
  const wallet = useAnchorWallet();
  const connected = !!wallet?.publicKey;

  const [activeForm, setActiveForm] = useState< 'home' | 'add' | 'remove' | 'swap' | null>(null);
  const [tokenA, setTokenA] = useState('H68y5nKjyc8ESB6dn7syQ1FWn1axU7DYDB5VE9MTAU2c');
  const [tokenB, setTokenB] = useState('7ffSz8Yyi7Zy1nLR7L7WSAUH7LcWt9uX1tMvtijD4fqX');
  const [poolStatus, setPoolStatus] = useState<-1 | 0 | 1 | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null); 
  
  const [amountA, setAmountA] = useState('10');
  const [amountB, setAmountB] = useState('10');
  const [amountLP, setAmountLP] = useState('7');
  const [amountSwapIn, setAmountSwapIn] = useState('10000');
  const [tokenSwapIn, setTokenSwapIn] = useState(tokenA);
  const [amountMinSwapOut, setAmountMinSwapOut] = useState('1');

  const searchParams = useSearchParams();
  const formParam = searchParams.get("form");

  // Check pool existence
  useEffect(() => {
    const runCheck = async () => {
      try {
        if (!tokenA || !tokenB) {
          setPoolStatus(null); // not checked yet
          return;
        }
        if (! await isValidSolanaTokenAddress(tokenA) || ! await isValidSolanaTokenAddress(tokenB)) {
          setPoolStatus(-1);
          return;
        }
        const exists = await checkPoolOnDevnet(tokenA, tokenB);
        setPoolStatus(exists ? 1 : 0);
      } catch (err) {
        console.error(err);
        setPoolStatus(0);
      }
    };
    runCheck();
  }, [tokenA, tokenB]);

  // set form from header navigation
  useEffect(() => {
    if (formParam === "add") setActiveForm("add");
    else if (formParam === "remove") setActiveForm("remove");
    else if (formParam === "swap") setActiveForm("swap");
    else setActiveForm("home");
  }, [formParam]);

  // const handleAction = async (action: 'add' | 'remove' | 'swap' | 'init') => {
  //   setError(null);

  //   // if (!wallet || !wallet.connected || !wallet.publicKey) {
  //   if (!wallet || !wallet.publicKey) {

  //     setError('Wallet not connected');
  //     return;
  //   }
    
  //   if (poolStatus === 0) {
  //     if (action === 'init') {
  //       try {
  //         console.log("Initializing Pool:", { tokenA, tokenB});
  //         const txSig = await handleInitPool(
  //           tokenA, tokenB, wallet
  //         );
  //         console.log("Tx signature:", txSig);
  //         setTxSig(txSig);
  //         const exists = await checkPoolOnDevnet(tokenA, tokenB);
  //         setPoolStatus(exists ? 1 : 0);
  //       } 
  //       catch (err: unknown) {
  //         console.error("Remove liquidity failed:", err);
  //         if (err instanceof Error) setError(err.message || 'Transaction failed');
  //         setError(String(err) || 'Transaction failed');
  //       }
  //     }
  //   }

  //   if (poolStatus !== 1) {
  //     setError('Pool does not exist (or) invalid token addresses');
  //     return;
  //   }
    
  //   if (action === 'add') {
  //     try {
  //       console.log("Adding liquidity:", { tokenA, tokenB, amountA, amountB });
  //       const txSig = await handleAddLiquidity(
  //         tokenA, tokenB, Number(amountA), Number(amountB), wallet
  //       );
  //       console.log("Tx signature:", txSig);
  //       setTxSig(txSig);
  //     } 
  //     catch (err: unknown) {
  //       console.error("Add liquidity failed:", err);
  //       if (err instanceof Error) setError(err.message || 'Transaction failed');
  //       setError(String(err) || 'Transaction failed');
  //     }
  //   }

  //   if (action === 'remove') {
  //     try {
  //       console.log("Removing liquidity:", { tokenA, tokenB, amountLP });
  //       const txSig = await handleRemoveLiquidity(
  //         tokenA, tokenB, Number(amountLP), wallet
  //       );
  //       console.log("Tx signature:", txSig);
  //       setTxSig(txSig);
  //     } 
  //     catch (err: unknown) {
  //       console.error("Remove liquidity failed:", err);
  //       if (err instanceof Error) setError(err.message || 'Transaction failed');
  //       setError(String(err) || 'Transaction failed');
  //     }
  //   }

  //   if (action === 'swap') {
  //     try {
  //       const txSig = await handleSwapTokens(
  //         tokenA, tokenB, tokenSwapIn, Number(amountSwapIn), Number(amountMinSwapOut), wallet
  //       );
  //       console.log("Tx signature:", txSig);
  //       setTxSig(txSig);
  //     } 
  //     catch (err:unknown) {
  //       console.error("Swap Tokens failed:", err);
  //       if (err instanceof Error) setError(err.message || 'Transaction failed');
  //       setError(String(err) || 'Transaction failed');
  //     }
  //   }
  // };

  // const connected = wallet?.publicKey!=null;
  return (
    // <div className="flex flex-col items-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <div className="flex flex-col items-center min-h-[70vh] bg-black/10 py-6 rounded-3xl">
      <h1 className="text-4xl font-extrabold text-yellow-400 drop-shadow-xl mb-2">⚡️ MiniSwap</h1>

      {/* Token inputs */}
      <TokenInputs tokenA={tokenA} setTokenA={setTokenA} tokenB={tokenB} setTokenB={setTokenB} />

      {/* Status */}
      <PoolStatus poolStatus={poolStatus} />

      {/* Wallet not connected notice */}
      {!connected && (
        <p className="text-orange-400 mt-2">⚠️ Please connect your wallet to perform actions</p>
      )} 

      {/* Init Pool */}
      {/* {poolStatus==0 && 
        <div className="flex flex-col sm:flex-row gap-4 mt-20 w-full max-w-xl">
      
          <button 
            onClick={() => handleAction('init')}
            disabled={!connected}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500/80 via-purple-500/80 to-blue-500/80 
           hover:from-yellow-400 hover:via-pink-400 hover:to-purple-500
           text-black font-bold rounded-2xl shadow-2xl transition-all border border-yellow"
          >
            Create Pool
          </button>
        </div>
      } */}


      {/* Forms */}
      <ActionForms 
        activeForm={activeForm} 
        // handleAction={handleAction} 
        poolStatus={poolStatus} 
        tokenA={tokenA}
        tokenB={tokenB}
        amountA={amountA}
        setAmountA={setAmountA}
        amountB={amountB}
        setAmountB={setAmountB}
        amountLP={amountLP}
        setAmountLP={setAmountLP}
        amountSwapIn={amountSwapIn}
        setAmountSwapIn={setAmountSwapIn}
        tokenSwapIn={tokenSwapIn}
        setTokenSwapIn={setTokenSwapIn}
        amountMinSwapOut={amountMinSwapOut}
        setAmountMinSwapOut={setAmountMinSwapOut}
        walletConnected={connected}
      />

      {/* Error display */}
      {error && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 rounded-3xl">
          <div className="bg-white/20 backdrop-blur-lg border-2 border-red-600 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            
            {/* Title with Cross */}
            <h2 className="text-2xl font-bold text-red-500 flex items-center justify-center gap-2">
              ❌ Error
            </h2>

            {/* Error */}
            <p className="mt-4 text-red-100 break-words">
              {error}
            </p>

            {/* OK button */}
            <div className="mt-6">
              <button
                onClick={() => setError(null)}
                className="px-6 py-2 bg-red-600/80 hover:bg-red-500/80 text-white font-bold rounded-2xl shadow-lg transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Success Tx display */}
      {txSig && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white/10 backdrop-blur-lg border-2 border-green-500 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">

            {/* Title with tick */}
            <h2 className="text-2xl font-bold text-green-400 flex items-center justify-center gap-2">
              ✅ Transaction Successful
            </h2>

            {/* Tx Hash & Link */}
            <p className="mt-4 text-green-100 break-words">
              View Transaction: {" "}
              <a
                href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-300 underline hover:text-yellow-400"
              >
                {txSig.slice(0, 8)}...{txSig.slice(-8)}
              </a>
            </p>

            {/* OK button */}
            <div className="mt-6">
              <button
                onClick={() => setTxSig(null)}
                className="px-6 py-2 bg-green-600/80 hover:bg-green-500/80 text-white font-bold rounded-2xl shadow-lg transition-all"
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
