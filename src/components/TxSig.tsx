"use client";

export default function TxSig({txSig, setTxSig}:{txSig:string|null; setTxSig: (v:string|null) => void}){

if (!txSig) return;
  return(
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
      )
}