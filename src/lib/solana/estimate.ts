'use client';

import {BN} from "@coral-xyz/anchor";

function scaleLiquidityAmounts(
  amountA: BN | number,
  amountB: BN | number,
  decimalsA: number,
  decimalsB: number
): { scaledA: BN; scaledB: BN } {
  const bnA = BN.isBN(amountA) ? amountA : new BN(amountA);
  const bnB = BN.isBN(amountB) ? amountB : new BN(amountB);

  const lpDecimals = new BN(10).pow(new BN(6));  //10^6

  const scaledA = bnA
    .mul(lpDecimals)
    .div(new BN(10).pow(new BN(decimalsA)));

  const scaledB = bnB
    .mul(lpDecimals)
    .div(new BN(10).pow(new BN(decimalsB)));
  return { scaledA, scaledB };
}

export function estimateLpToMint(
  vaultA: bigint,
  vaultB: bigint,
  supplyLP: bigint,
  amountA: bigint,
  amountB: bigint,
  decimalA: number,
  decimalB: number

): bigint {
  const { scaledA, scaledB } = scaleLiquidityAmounts(
    new BN(amountA.toString()),
    new BN(amountB.toString()),
    decimalA,
    decimalB,
  );

  console.log("Scaled adding A:", scaledA.toString());
  console.log("Scaled adding B:", scaledB.toString());

  amountA = BigInt(scaledA.toString());
  amountB = BigInt(scaledB.toString());

  console.log("Vault A:", vaultA.toString());
  console.log("Vault B:", vaultA.toString());
  console.log("LP Supply:", supplyLP.toString());


  if (vaultA === BigInt(0) && vaultB === BigInt(0)) {
    // sqrt(amountA * amountB)
    return BigInt(Math.floor(Math.sqrt(Number(amountA * amountB))));
  } else {
    const lpFromA = (amountA * supplyLP) / vaultA;
    const lpFromB = (amountB * supplyLP) / vaultB;
    return lpFromA < lpFromB ? lpFromA : lpFromB;
  }
}

export function estimateWithdrawTokenAmounts(
  vaultA: bigint,
  vaultB: bigint,
  supplyLP: bigint,
  amountLpBurn: bigint,
) {

  console.log("Vault A:", vaultA.toString());
  console.log("Vault B:", vaultA.toString());
  console.log("LP Supply:", supplyLP.toString());

  const amountA = (vaultA * amountLpBurn) / supplyLP;
  const amountB = (vaultB * amountLpBurn) / supplyLP;
  console.log("Withdraw Token A:", amountA.toString());
  console.log("Withdraw Token B:", amountB.toString());  

  return {amountA, amountB};
}

export function estimateSwappedTokenOut(
  x: bigint,
  y: bigint,
  amountSwapIn: bigint,
) : bigint {

  console.log("Vault A:", x.toString());
  console.log("Vault B:", y.toString());
  
  const k = x * y;
  const newX = x + amountSwapIn;
  const newY = k / newX;
  const amountOut = y - newY;
  console.log("Withdraw Token B amount :", amountOut.toString());  
  return amountOut;
}