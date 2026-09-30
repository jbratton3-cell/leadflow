import { inPeriod, inRange, nyStamp } from "@/lib/ny-dates";

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
  toStamp?: string,
) {
  const contractsByKey = new Map(contracts.map((contract) => [contract.key, contract]));
  const allocatedByContract = new Map<string, number>();
  let count = 0;
  let total = 0;

  const chronological = payments
    .map((payment, index) => ({ payment, index }))
    .filter(({ payment }) => {
      if (paymentType && payment.paymentType !== paymentType) return false;
      if (payment.contractKey === null || !contractsByKey.has(payment.contractKey)) return false;
      const amount = Number(payment.amount ?? 0);
      return Boolean(nyStamp(payment.receivedAt)) && Number.isFinite(amount) && amount > 0;
    })
    .sort((a, b) => {
      const aTime = new Date(a.payment.receivedAt!).getTime();
      const bTime = new Date(b.payment.receivedAt!).getTime();
      return aTime - bTime || a.index - b.index;
    });

  for (const { payment } of chronological) {
    const stamp = nyStamp(payment.receivedAt)!;
    if (toStamp && stamp >= toStamp) continue;

    const contractKey = payment.contractKey!;
    const contractAmount = Math.max(
      Number(contractsByKey.get(contractKey)?.amount ?? 0),
      0,
    );
    const previouslyAllocated = allocatedByContract.get(contractKey) ?? 0;
    const amount = Number(payment.amount ?? 0);
    const credited = Math.min(amount, Math.max(contractAmount - previouslyAllocated, 0));
    allocatedByContract.set(contractKey, previouslyAllocated + credited);

    const paymentIsInPeriod = toStamp
      ? inPeriod(payment.receivedAt, fromStamp, toStamp)
      : inRange(payment.receivedAt, fromStamp);
    if (!paymentIsInPeriod) continue;

    // A receipt belongs to the month in which the money arrived, even when the
    // corresponding contract was sold earlier. Earlier receipts consume the
    // contract cap first so period totals cannot inflate lifetime collections.
    count += 1;
    total += credited;
  }

  return { count, total };
}

export function soldStats(
  contracts: RevenueContract[],
  fromStamp: string,
  toStamp?: string,
) {
  const matching = contracts.filter((contract) =>
    toStamp
      ? inPeriod(contract.soldAt, fromStamp, toStamp)
      : inRange(contract.soldAt, fromStamp),
  );
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