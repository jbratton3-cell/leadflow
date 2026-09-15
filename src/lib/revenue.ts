import { inRange } from "@/lib/ny-dates";

export type RevenueContract = {
  key: string;
  amount: string | number | null;
  soldAt: Date | string | null;
};

export type RevenuePayment = {
  contractKey: string | null;
  amount: string | number | null;
  receivedAt: Date | string | null;
  paymentType?: string | null;
};

export type RevenueJob = {
  id: number;
  saleId: number | null;
  contractAmount: string | number | null;
  createdAt: Date | string | null;
  notes: string | null;
};

export function buildRevenueContracts(
  sales: Array<{ id: number; amount: string | number | null; soldAt: Date | string | null }>,
  jobs: RevenueJob[],
): RevenueContract[] {
  const contracts: RevenueContract[] = sales.map((sale) => ({
    key: `sale:${sale.id}`,
    amount: sale.amount,
    soldAt: sale.soldAt,
  }));

  for (const job of jobs) {
    const amount = Number(job.contractAmount ?? 0);
    if (
      job.saleId === null &&
      Number.isFinite(amount) &&
      amount > 0 &&
      job.notes?.includes("Imported from Housecall Pro job ")
    ) {
      contracts.push({
        key: `job:${job.id}`,
        amount,
        soldAt: job.createdAt,
      });
    }
  }

  return contracts;
}

export function importedJobIds(jobs: RevenueJob[]): Set<number> {
  return new Set(
    jobs
      .filter(
        (job) =>
          job.saleId === null &&
          Number(job.contractAmount ?? 0) > 0 &&
          job.notes?.includes("Imported from Housecall Pro job "),
      )
      .map((job) => job.id),
  );
}

/**
 * Resolve an HCP payment to either a LeadFlow sale or an imported HCP job.
 * A conflicting job/invoice relationship is left unresolved for review.
 */
export function linkedContractKey(
  jobId: number | null,
  invoiceJobId: number | null,
  jobSaleId: number | null,
  invoiceSaleId: number | null,
  importedJobs: Set<number>,
): string | null {
  if (jobSaleId !== null && invoiceSaleId !== null && jobSaleId !== invoiceSaleId) {
    return null;
  }
  const saleId = jobSaleId ?? invoiceSaleId;
  if (saleId !== null) return `sale:${saleId}`;

  const job = jobId ?? invoiceJobId;
  return job !== null && importedJobs.has(job)
    ? `job:${job}`
    : null;
}

export function collectedStats(
  contracts: RevenueContract[],
  payments: RevenuePayment[],
  fromStamp: string,
  paymentType?: string,
) {
  const contractsByKey = new Map(contracts.map((contract) => [contract.key, contract]));
  const amountByContract = new Map<string, number>();
  let count = 0;

  for (const payment of payments) {
    if (paymentType && payment.paymentType !== paymentType) continue;
    if (!inRange(payment.receivedAt, fromStamp) || payment.contractKey === null) continue;

    const contract = contractsByKey.get(payment.contractKey);
    if (!contract || !inRange(contract.soldAt, fromStamp)) continue;
    const amount = Number(payment.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    amountByContract.set(
      payment.contractKey,
      (amountByContract.get(payment.contractKey) ?? 0) + amount,
    );
    count += 1;
  }

  const total = Array.from(amountByContract.entries()).reduce((sum, [key, amount]) => {
    const contractAmount = Number(contractsByKey.get(key)?.amount ?? 0);
    return sum + Math.min(Math.max(amount, 0), Math.max(contractAmount, 0));
  }, 0);

  return { count, total };
}

export function soldStats(contracts: RevenueContract[], fromStamp: string) {
  const matching = contracts.filter((contract) => inRange(contract.soldAt, fromStamp));
  return {
    count: matching.length,
    total: matching.reduce((sum, contract) => sum + Number(contract.amount ?? 0), 0),
  };
}

/**
 * Paid invoices and manually recorded settlements must not exceed the
 * contract amount attached to that individual record.
 */
export function withinContractAmount(collected: number, contractAmount: number): number {
  const safeCollected = Number.isFinite(collected) ? Math.max(collected, 0) : 0;
  const safeContract = Number.isFinite(contractAmount) ? Math.max(contractAmount, 0) : 0;
  return Math.min(safeCollected, safeContract);
}