"use client";

import { useMemo, useState } from "react";
import { addEstimateItem } from "@/lib/estimate-actions";

type BookItem = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  unit: string;
  category: string;
};

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default function AddEstimateItemForm({
  estimateId,
  book,
}: {
  estimateId: number;
  book: BookItem[];
}) {
  const [picked, setPicked] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");

  const grouped = useMemo(() => {
    const map = new Map<string, BookItem[]>();
    for (const item of book) {
      const cat = (item.category || "Uncategorized").trim() || "Uncategorized";
      const list = map.get(cat) ?? [];
      list.push(item);
      map.set(cat, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [book]);

  function onPick(id: string) {
    setPicked(id);
    if (!id) return;
    const item = book.find((b) => String(b.id) === id);
    if (!item) return;
    const body = (item.description || "").trim();
    setDescription(body ? `${item.name}\n\n${body}` : item.name);
    setUnitPrice(String(Number(item.price) || 0));
    if (!quantity) setQuantity("1");
  }

  return (
    <form action={addEstimateItem} className="grid grid-cols-12 gap-2 border-t border-slate-100 pt-4">
      <input type="hidden" name="estimateId" value={estimateId} />
      {book.length > 0 && (
        <div className="col-span-12">
          <label className={label}>From pricebook</label>
          <select
            value={picked}
            onChange={(e) => onPick(e.target.value)}
            className={input}
          >
            <option value="">Custom line — type below</option>
            {grouped.map(([cat, items]) => (
              <optgroup key={cat} label={cat}>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                    {Number(it.price) ? ` — $${Number(it.price).toLocaleString()}` : ""}
                    {it.unit ? ` / ${it.unit}` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">
            Pick a service and the full work description + price fill in. Edit anything before adding.
          </p>
        </div>
      )}
      <div className="col-span-12 md:col-span-6">
        <label className={label}>Description</label>
        <textarea
          name="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Vinyl replacement window"
          className={input}
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <label className={label}>Qty</label>
        <input
          name="quantity"
          type="number"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className={input}
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <label className={label}>Unit Price</label>
        <input
          name="unitPrice"
          type="number"
          step="0.01"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          className={input}
        />
      </div>
      <div className="col-span-4 md:col-span-2 flex items-end">
        <button className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Add
        </button>
      </div>
    </form>
  );
}
