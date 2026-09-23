"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PayPalApproveData = { orderID: string };
type PayPalButtonsInstance = {
  isEligible: () => boolean;
  render: (target: HTMLElement) => Promise<void>;
  close?: () => Promise<void>;
};
type PayPalNamespace = {
  FUNDING: { PAYPAL: string; CARD: string };
  Buttons: (opts: Record<string, unknown>) => PayPalButtonsInstance;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

function sdkUrl(clientId: string): string {
  const query = new URLSearchParams({
    "client-id": clientId,
    currency: "USD",
    intent: "capture",
    components: "buttons",
    "enable-funding": "card",
  });
  return `https://www.paypal.com/sdk/js?${query.toString()}`;
}

export default function PayPalInvoiceCheckout({
  clientId,
  token,
  amountLabel,
  sandbox,
}: {
  clientId: string;
  token: string;
  amountLabel: string;
  sandbox: boolean;
}) {
  const router = useRouter();
  const paypalTarget = useRef<HTMLDivElement>(null);
  const cardTarget = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cardAvailable, setCardAvailable] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const buttonInstances: PayPalButtonsInstance[] = [];

    const createOrder = async (): Promise<string> => {
      setError("");
      const res = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { id?: string; status?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error || "Could not start payment.");
      if (data.status === "COMPLETED") {
        setSuccess(true);
        router.refresh();
      }
      return data.id;
    };

    const onApprove = async (data: PayPalApproveData) => {
      setError("");
      const res = await fetch(`/api/paypal/orders/${encodeURIComponent(data.orderID)}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Payment could not be confirmed.");
      }
      setSuccess(true);
      router.refresh();
    };

    const renderButtons = async () => {
      if (cancelled || rendered.current || !window.paypal) return;
      rendered.current = true;
      const common = {
        createOrder,
        onApprove,
        onCancel: () => setError("Payment was cancelled. Your invoice is still unpaid."),
        onError: (err: unknown) => {
          console.error("PayPal checkout error", err);
          setError(err instanceof Error ? err.message : "PayPal could not complete the payment.");
        },
      };

      if (paypalTarget.current) {
        const paypalButton = window.paypal.Buttons({
          ...common,
          fundingSource: window.paypal.FUNDING.PAYPAL,
          style: { layout: "vertical", shape: "rect", height: 44, label: "paypal" },
        });
        if (paypalButton.isEligible()) {
          buttonInstances.push(paypalButton);
          await paypalButton.render(paypalTarget.current);
        }
      }

      if (cardTarget.current) {
        const cardButton = window.paypal.Buttons({
          ...common,
          fundingSource: window.paypal.FUNDING.CARD,
          style: { layout: "vertical", shape: "rect", height: 44, label: "pay" },
        });
        if (cardButton.isEligible()) {
          buttonInstances.push(cardButton);
          await cardButton.render(cardTarget.current);
        } else {
          setCardAvailable(false);
        }
      }
      setLoading(false);
    };

    const existing = document.getElementById("leadflow-paypal-sdk") as HTMLScriptElement | null;
    if (window.paypal) {
      void renderButtons();
    } else if (existing) {
      existing.addEventListener("load", () => void renderButtons(), { once: true });
      existing.addEventListener("error", () => {
        setLoading(false);
        setError("PayPal checkout could not load. Please refresh and try again.");
      }, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = "leadflow-paypal-sdk";
      script.src = sdkUrl(clientId);
      script.async = true;
      script.onload = () => void renderButtons();
      script.onerror = () => {
        setLoading(false);
        setError("PayPal checkout could not load. Please refresh and try again.");
      };
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      rendered.current = false;
      for (const instance of buttonInstances) void instance.close?.();
      if (paypalTarget.current) paypalTarget.current.innerHTML = "";
      if (cardTarget.current) cardTarget.current.innerHTML = "";
    };
  }, [clientId, router, token]);

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        Payment received. Your invoice and receipt are being updated.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-base font-bold text-slate-900">Pay by Card or PayPal</div>
      <p className="mt-1 text-sm text-slate-500">
        Securely pay {amountLabel}. LeadFlow never sees or stores your card number.
      </p>
      {sandbox && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Sandbox test payment — no real money will move.
        </div>
      )}
      <div className="mt-4 space-y-2">
        <div ref={paypalTarget} />
        <div ref={cardTarget} />
      </div>
      {loading && <div className="mt-2 text-sm text-slate-500">Loading secure checkout…</div>}
      {!loading && !cardAvailable && (
        <p className="mt-2 text-xs text-slate-400">
          Direct card checkout is not available for this PayPal account yet. PayPal may still offer a card option after you continue.
        </p>
      )}
      {error && (
        <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}
    </div>
  );
}
