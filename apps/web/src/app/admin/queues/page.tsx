"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface QueueData {
  image: Record<string, number>;
  pdf: Record<string, number>;
}

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<QueueData | null>(null);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/v1/admin/stats");
        const data = await res.json();
        setQueues(data.data.queues);
      } catch {
        console.error("Failed to fetch queues");
      }
    };

    fetchQueues();
    const interval = setInterval(fetchQueues, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Queues</h1>
        <Link href="/admin" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {queues && Object.entries(queues).map(([name, counts]) => (
          <div key={name} className="card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {name.charAt(0).toUpperCase() + name.slice(1)} Queue
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(counts).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                  <p className="text-xs text-gray-500">{key}</p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
