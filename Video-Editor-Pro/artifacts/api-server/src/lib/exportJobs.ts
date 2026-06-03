export type ExportJob = {
  status: "pending" | "running" | "done" | "error";
  progress: number; // 0-100
  message: string;
  downloadUrl?: string;
  objectPath?: string;
  error?: string;
  createdAt: number;
};

const jobs = new Map<string, ExportJob>();

// Clean up jobs older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, 10 * 60 * 1000);

export function createJob(id: string): ExportJob {
  const job: ExportJob = {
    status: "pending",
    progress: 0,
    message: "Preparing export…",
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function updateJob(id: string, updates: Partial<ExportJob>) {
  const job = jobs.get(id);
  if (job) Object.assign(job, updates);
}

export function getJob(id: string): ExportJob | undefined {
  return jobs.get(id);
}
