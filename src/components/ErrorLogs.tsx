"use client";

export default function ErrorLogs({error, setError}:{error:string|null; setError: (v:string|null) => void}){

if (!error) return;
  return(
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
  )
}