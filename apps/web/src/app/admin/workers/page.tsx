"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface WorkerInfo {
  name: string;
  queue: string;
  status: string;
  jobs: Record<string, number>;
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/v1/admin/workers");
        const data = await res.json();
        setWorkers(data.data);
      } catch {
        console.error("Failed to fetch workers");
      }
    };

    fetchWorkers();
    const interval = setInterval(fetchWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workers</h1>
        <Link href="/admin" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {workers.map((w) => (
          <div key={w.name} className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{w.name}</h2>
              <span className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${w.status === "online" ? "bg-green-500" : "bg-red-500"}`} />
                <span className={w.status === "online" ? "text-green-600" : "text-red-600"}>
                  {w.status}
                </span>
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Queue: {w.queue}</p>
              <div className="grid grid-cols-4 gap-4">
                {["waiting", "active", "completed", "failed"].map((key) => (
                  <div key={key} className="text-center">
                    <p className="text-xs text-gray-500">{key}</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{w.jobs[key] ?? 0}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
