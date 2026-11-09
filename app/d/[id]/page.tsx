import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Dataset } from "@/lib/types";
import { Chat } from "./chat";

export default function Page({ params }: PageProps<"/d/[id]">) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Loading dataset…</p>}>
      {params.then(async ({ id }) => {
        const ds = await loadDataset(id);
        if (!ds) notFound();
        return <Chat ds={ds} />;
      })}
    </Suspense>
  );
}

// TODO: read the dataset from Postgres and check ownership.
async function loadDataset(id: string): Promise<Dataset | null> {
  void id;
  return null;
}
