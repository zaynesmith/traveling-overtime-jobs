import { useRouter } from "next/router";

export default function JobDetails() {
  const { query } = useRouter();
  const jobId = query.id;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Job details</h1>
      <p className="text-gray-600">Job ID: {jobId}</p>
      <p className="text-gray-600">
        This public placeholder shows how a specific traveling overtime opportunity could appear.
      </p>
    </main>
  );
}
