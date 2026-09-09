"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminStats {
  jobs: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
    queued: number;
  };
  queues: {
    image: Record<string, number>;
    pdf: Record<string, number>;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/v1/admin/stats");
        const data = await res.json();
        setStats(data.data);
      } catch {
        console.error("Failed to fetch stats");
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <Link href="/" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to FileTools
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value={stats?.jobs.total ?? 0}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/30"
        />
        <StatCard
          title="Completed"
          value={stats?.jobs.completed ?? 0}
          color="text-green-600"
          bg="bg-green-50 dark:bg-green-900/30"
        />
        <StatCard
          title="Processing"
          value={stats?.jobs.processing ?? 0}
          color="text-brand-600"
          bg="bg-brand-50 dark:bg-brand-900/30"
        />
        <StatCard
          title="Failed"
          value={stats?.jobs.failed ?? 0}
          color="text-red-600"
          bg="bg-red-50 dark:bg-red-900/30"
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Workers</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <WorkerCard
            name="Image Worker"
            queue="image-convert"
            status="online"
            jobs={stats?.queues.image}
          />
          <WorkerCard
            name="PDF Worker"
            queue="pdf-convert"
            status="online"
            jobs={stats?.queues.pdf}
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Queue Status</h2>
        <div className="card">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <QueueStat label="Waiting" value={stats?.queues.image.waiting ?? 0} />
            <QueueStat label="Active" value={stats?.queues.image.active ?? 0} />
            <QueueStat label="Completed" value={stats?.queues.image.completed ?? 0} />
            <QueueStat label="Failed" value={stats?.queues.image.failed ?? 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, bg }: { title: string; value: number; color: string; bg: string }) {
  return (
    <div className={`card ${bg}`}>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function WorkerCard({
  name,
  queue,
  status,
  jobs,
}: {
  name: string;
  queue: string;
  status: string;
  jobs?: Record<string, number>;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Queue: {queue}</p>
        </div>
        <span className="flex items-center gap-2 text-sm text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {status}
        </span>
      </div>
      {jobs && (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <MiniStat label="Waiting" value={jobs.waiting ?? 0} />
          <MiniStat label="Active" value={jobs.active ?? 0} />
          <MiniStat label="Done" value={jobs.completed ?? 0} />
          <MiniStat label="Failed" value={jobs.failed ?? 0} />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{value}</p>
    </div>
  );
}

function QueueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-700 dark:text-gray-300">{value}</p>
    </div>
  );
}
