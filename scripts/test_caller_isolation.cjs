const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const permissions = read('src/lib/permissions.ts');
const js = ts.transpileModule(permissions, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mockModule = { exports: {} };
vm.runInNewContext(js, { module: mockModule, exports: mockModule.exports });
const { can } = mockModule.exports;
for (const permission of ['leads', 'call_center', 'appointments']) assert.equal(can('caller', permission), true);
for (const permission of ['dashboard', 'estimates', 'invoices', 'sales', 'settings', 'users', 'production', 'import', 'reports', 'job_financials', 'marketing']) assert.equal(can('caller', permission), false);
assert.equal(can('agent', 'estimates'), true, 'existing sales agents retain estimate access');
assert.equal(can('agent', 'call_center'), true, 'existing sales agents retain call center access');

const leadPage = read('src/app/leads/[id]/page.tsx');
assert.ok(leadPage.indexOf('if (user.role === "caller") return <CallerLeadDetail lead={lead} />;') < leadPage.indexOf('const [orgRow]'), 'caller view must return before querying financial data');
const callerPage = read('src/components/CallerLeadDetail.tsx');
for (const sensitive of ['invoices', 'estimates', 'createManualFinalInvoice', 'createSale', 'deleteLead']) assert.equal(callerPage.includes(sensitive), false, `caller detail should not reference ${sensitive}`);
assert.match(read('src/app/dashboard/page.tsx'), /user\.role === "caller"\) redirect\("\/call-center"\)/);
assert.match(read('src/components/TrialGuideHost.tsx'), /user\.role === "caller"/);

const userActions = read('src/lib/actions.ts');
for (const name of ['createLead', 'updateLead', 'logOutreach', 'createSale', 'createJob', 'createProperty', 'updateProperty', 'archiveProperty', 'createAccountJob', 'updateJob', 'recordFinancingSettlement', 'markJobCompleted', 'createRep', 'createSource', 'updateSource', 'createProduct']) {
  const start = userActions.indexOf(`export async function ${name}(`);
  const next = userActions.indexOf('\nexport async function ', start + 1);
  const body = userActions.slice(start, next === -1 ? undefined : next);
  assert.ok(start >= 0 && body.includes('await requireNonCaller()'), `${name} must block caller`);
}
const billing = read('src/lib/invoice-actions.ts');
assert.match(billing, /^import "server-only";/);
for (const name of ['createManualFinalInvoice', 'recordDepositPaid', 'markInvoicePaid', 'sendPaymentReceipt', 'voidInvoice', 'resendInvoice']) {
  const start = billing.indexOf(`export async function ${name}(`);
  const body = billing.slice(start, start + 240);
  assert.ok(start >= 0 && body.includes('"use server"') && body.includes('requireNonCaller()'), `${name} must block caller`);
}
assert.match(billing, /export async function adjustDepositInvoiceAmount\(formData: FormData\) \{\s*"use server";\s*const user = await requireAccess\("invoices"\)/);
assert.match(read('src/lib/qb-actions.ts'), /^import "server-only";/);
assert.match(read('src/app/api/invoices/[id]/receipt/route.ts'), /user\.role === "caller"/);
assert.match(read('src/app/api/estimates/[id]/pdf/route.ts'), /user\.role === "caller"/);
assert.match(read('src/lib/auth-actions.ts'), /inserted\[0\]\.role === "caller" \? "call_center"/);
console.log('Limited caller isolation tests passed.');
