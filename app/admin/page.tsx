"use client"

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [ciMsg, setCiMsg] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInput.current?.files?.[0]) return;
    // In production, use FormData and real upload
    setUploadMsg("Uploading...");
    await fetch("/api/admin/upload", { method: "POST" });
    setUploadMsg("CSV uploaded (mocked)");
  };

  const triggerCI = async () => {
    setCiMsg("Triggering CI/CD...");
    // In production, call GitLab webhook
    setTimeout(() => setCiMsg("CI/CD pipeline triggered (mocked)"), 1000);
  };

  return (
    <div className="max-w-lg mx-auto p-6 mt-8 bg-white/60 dark:bg-black/40 rounded-2xl shadow-xl border border-border">
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
      <form className="mb-6" onSubmit={handleUpload}>
        <input type="file" ref={fileInput} accept=".csv" className="mb-2" />
        <Button type="submit" variant="secondary">Upload CSV</Button>
        {uploadMsg && <div className="text-xs mt-2">{uploadMsg}</div>}
      </form>
      <Button onClick={triggerCI} variant="outline">Trigger GitLab CI/CD</Button>
      {ciMsg && <div className="text-xs mt-2">{ciMsg}</div>}
    </div>
  );
} 