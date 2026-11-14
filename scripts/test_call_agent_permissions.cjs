const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/permissions.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const result = { exports: {} };
vm.runInNewContext(compiled, { module: result, exports: result.exports });
const { can, ROLE_PERMISSIONS, ROLES } = result.exports;

assert.deepEqual(Array.from(ROLE_PERMISSIONS.agent), [
  'dashboard', 'leads', 'call_center', 'appointments', 'estimates', 'sales',
]);
for (const role of ['admin', 'manager', 'agent']) {
  assert.equal(can(role, 'call_center'), true, `${role} should access the call center`);
}
for (const role of ['production', '', null, 'unknown']) {
  assert.equal(can(role, 'call_center'), false, `${role} should not access the call center`);
}
for (const permission of ['users', 'settings', 'import', 'invoices', 'reports', 'job_financials', 'production', 'marketing']) {
  assert.equal(can('agent', permission), false, `agent should not gain ${permission} access`);
}
assert.match(ROLES.find((role) => role.key === 'agent').description, /estimates/i);

const sidebar = fs.readFileSync(path.join(__dirname, '../src/components/Sidebar.tsx'), 'utf8');
const page = fs.readFileSync(path.join(__dirname, '../src/app/call-center/page.tsx'), 'utf8');
assert.match(sidebar, /href:\s*"\/call-center"[^\n]*perm:\s*"call_center"/);
assert.match(page, /requireAccess\("call_center"\)/);
assert.match(page, /eq\(leads\.orgId,\s*orgId\)/);
console.log('Call agent permission tests passed.');
