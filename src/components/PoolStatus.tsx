"use client";

export default function PoolStatus({ poolStatus }: { poolStatus: -1 | 0 | 1 | null }) {
  if (poolStatus === -1)
    return <p className="mt-4 text-center text-red-500 font-semibold">⚠️ Invalid Token Address</p>;

  if (poolStatus === 0)
    return <p className="mt-4 text-center text-yellow-600 font-semibold">⚠️ Pool does not exist for these tokens</p>;

  if (poolStatus === 1)
    return <p className="mt-4 text-center text-green-600 font-semibold">✅ Pool exists</p>;

  return null;
}
