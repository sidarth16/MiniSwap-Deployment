
function scaleLiquidityAmounts(
  amountA: bigint, decimalsA: number,
  amountB: bigint, decimalsB: number
): { scaledA: bigint; scaledB: bigint } {

    const lpDecimals = BigInt(10)**BigInt(6);  //10^6
    const tokenAdecimals = BigInt(10) ** BigInt(decimalsA); //10^<decimalsA>
    const tokenBdecimals = BigInt(10) ** BigInt(decimalsB); //10^<decimalsA>


    const scaledA = (amountA * lpDecimals) / tokenAdecimals;
    const scaledB = (amountB * lpDecimals) / tokenBdecimals;

    return { scaledA, scaledB };
}

export function estimateLpToMint(
  vaultA: bigint,  vaultB: bigint,  supplyLP: bigint,
  amountA: bigint,  amountB: bigint,
  decimalA: number,  decimalB: number
): string {
    const { scaledA, scaledB } = scaleLiquidityAmounts(
        amountA,decimalA, amountB,decimalB,
    );

    amountA = BigInt(scaledA.toString());
    amountB = BigInt(scaledB.toString());
    
      // console.log(" A:", amountA.toString());
      // console.log(" B:", amountB.toString());
      // console.log("Scaled adding A:", scaledA.toString());
      // console.log("Scaled adding B:", scaledB.toString());
      // console.log("Vault A:", vaultA.toString());
      // console.log("Vault B:", vaultB.toString());
      // console.log("LP Supply:", supplyLP.toString());

    if (vaultA === BigInt(0) && vaultB === BigInt(0)) {
        // sqrt of (amountA * amountB)
        const lp = BigInt(Math.floor(Math.sqrt(Number(amountA * amountB))));
        return lp.toString(); // convert to UI decimals
    } 
    else {
        const lpFromA = (amountA * supplyLP) / vaultA;
        const lpFromB = (amountB * supplyLP) / vaultB;

        // console.log("lpFromA:", lpFromA.toString());
        // console.log("lpFromB:", lpFromB.toString());
        return lpFromA < lpFromB ? lpFromA.toString() : lpFromB.toString();
    }

    // // scale vaults to match multiplier
    // const multiplier = BigInt(10 ** 6);
    // const scaledVaultA = (vaultA * multiplier) / (BigInt(10) ** BigInt(decimalA));
    // const scaledVaultB = (vaultB * multiplier) / (BigInt(10) ** BigInt(decimalB));

    // // calculate LP from both sides
    // const lpFromA = (scaledA * supplyLP) / scaledVaultA;
    // const lpFromB = (scaledB * supplyLP) / scaledVaultB;

    // const lpMint = lpFromA < lpFromB ? lpFromA : lpFromB;

    // return fromBaseUnits(lpMint, 6); // return as string with decimals
}

export function estimateWithdrawTokenAmounts(
    vaultA: bigint,  vaultB: bigint,  supplyLP: bigint,  amountLpToBurn: bigint,
) {

    // console.log("Vault A:", vaultA.toString());
    // console.log("Vault B:", vaultB.toString());
    // console.log("LP Supply:", supplyLP.toString());

    const amountA = (vaultA * amountLpToBurn) / supplyLP;
    const amountB = (vaultB * amountLpToBurn) / supplyLP;
    // console.log("Withdraw Token A:", amountA.toString());
    // console.log("Withdraw Token B:", amountB.toString());  

    return {amountA, amountB};
}

export function estimateSwappedTokenOut(
  x: bigint,  y: bigint,
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