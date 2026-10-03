"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";

const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-ak-800 focus:outline-none";
const labelCls = "mb-1 block text-xs font-bold uppercase tracking-wider text-muted";

export default function RequestBookPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    bookName: "",
    author: "",
    isbn: "",
    language: "English",
    qty: "1",
    name: "",
    mobile: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bookName.trim()) return setError("Please enter the book name.");
    if (!form.name.trim()) return setError("Please enter your name.");
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) return setError("Please enter a valid 10-digit mobile number.");
    setError("");
    try {
      const raw = localStorage.getItem("ak_requests");
      const list = raw ? JSON.parse(raw) : [];
      list.push({ ...form, at: new Date().toISOString() });
      localStorage.setItem("ak_requests", JSON.stringify(list));
    } catch {
      /* storage unavailable — still confirm */
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="py-6">
        <div className="mx-auto max-w-md rounded-xl border border-line bg-white p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf/10 text-leaf">
            <Icon size={26} d={<path d="m5 12.5 4.5 4.5L19 7.5" />} />
          </div>
          <h1 className="mt-3 font-display text-2xl text-ink">Request Received</h1>
          <p className="mt-2 text-sm text-muted">
            Your request has been received. We will try to arrange this book for you.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <a
              href="tel:+91-98290-00000"
              className="rounded-full bg-ak-800 px-6 py-2.5 text-sm font-bold text-white"
            >
              CALL US
            </a>
            <a
              href="https://wa.me/919829000000"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-ak-800 px-6 py-2.5 text-sm font-bold text-ak-800"
            >
              WHATSAPP US
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl text-ink">Can&apos;t Find Your Book?</h1>
        <p className="mt-1 text-sm text-muted">
          Tell us what you&apos;re looking for and we&apos;ll try to arrange it from our partner bookstores.
        </p>
        <img
          src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop"
          alt="Shelves of books at a partner bookstore"
          loading="lazy"
          className="mt-4 h-40 w-full rounded-xl border border-line object-cover"
        />
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <div>
            <label htmlFor="rb-book" className={labelCls}>Book name *</label>
            <input id="rb-book" className={inputCls} value={form.bookName} onChange={set("bookName")} placeholder="e.g. The Guide by R. K. Narayan" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rb-author" className={labelCls}>Author</label>
              <input id="rb-author" className={inputCls} value={form.author} onChange={set("author")} placeholder="Author name" />
            </div>
            <div>
              <label htmlFor="rb-isbn" className={labelCls}>ISBN</label>
              <input id="rb-isbn" className={inputCls} value={form.isbn} onChange={set("isbn")} placeholder="ISBN if known" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rb-lang" className={labelCls}>Language</label>
              <select id="rb-lang" className={inputCls} value={form.language} onChange={set("language")}>
                {["English", "Hindi", "Sanskrit", "Other"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rb-qty" className={labelCls}>Quantity</label>
              <input id="rb-qty" className={inputCls} value={form.qty} onChange={set("qty")} inputMode="numeric" min="1" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rb-name" className={labelCls}>Your name *</label>
              <input id="rb-name" className={inputCls} value={form.name} onChange={set("name")} placeholder="Full name" />
            </div>
            <div>
              <label htmlFor="rb-mobile" className={labelCls}>Mobile *</label>
              <input id="rb-mobile" className={inputCls} value={form.mobile} onChange={set("mobile")} inputMode="numeric" placeholder="10-digit mobile" />
            </div>
          </div>
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" className="rounded-full bg-ak-800 px-6 py-3 text-sm font-bold text-white">
            SUBMIT REQUEST
          </button>
        </form>
      </div>
    </div>
  );
}
