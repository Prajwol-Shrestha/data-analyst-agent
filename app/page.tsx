import Link from "next/link";
import { Upload } from "./upload";

export default function Home() {
  return (
    <>
      <header className="flex h-14 shrink-0 items-center border-b border-line bg-surface px-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-accent font-mono text-sm text-surface">∑</span>
          Analyst
        </Link>
      </header>
      <main className="w-full px-5 py-12 sm:py-16">
        <Upload />
      </main>
    </>
  );
}
