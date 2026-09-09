"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Job {
  id: string;
  status: string;
  converterId: string;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const url = filter
          ? `http://localhost:3001/api/v1/admin/jobs?status=${filter}`
          : "http://localhost:3001/api/v1/admin/jobs";
        const res = await fetch(url);
        const data = await res.json();
        setJobs(data.data);
      } catch {
        console.error("Failed to fetch jobs");
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [filter]);

  const statusColor: Record<string, string> = {
    queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    expired: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
        <Link href="/admin" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {["", "queued", "processing", "completed", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === s
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3">Job ID</th>
              <th className="px-4 py-3">Converter</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Error</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3 font-mono text-xs">{job.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{job.converterId}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[job.status] || ""}`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(job.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-red-500 text-xs">{job.error || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <p className="p-8 text-center text-gray-500">No jobs found</p>
        )}
      </div>
    </div>
  );
}
