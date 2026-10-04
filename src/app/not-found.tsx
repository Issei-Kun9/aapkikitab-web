import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <p aria-hidden="true" className="font-deva text-[64px] leading-none text-ak-100">४०४</p>
      <h1 className="mt-4 font-display text-[30px] font-bold leading-tight text-ink">This page isn&apos;t on our shelf</h1>
      <p className="mt-2 text-[15px] text-muted">The link may be old or mistyped. Let&apos;s get you back to the books.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex h-12 items-center rounded-full bg-ak-800 px-6 text-[15px] font-bold text-white hover:bg-ak-900">Go to home</Link>
        <Link href="/browse" className="inline-flex h-12 items-center rounded-full border border-ak-800/30 px-6 text-[15px] font-bold text-ak-800 hover:border-ak-800">Browse books</Link>
      </div>
    </div>
  );
}
