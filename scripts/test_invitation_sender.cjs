const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/notify.ts'), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;

function loadNotify(env, responseOk = true) {
  const requests = [];
  const smtpMessages = [];
  const mockedModule = { exports: {} };
  const nodemailer = {
    createTransport() {
      return { async sendMail(message) { smtpMessages.push(message); } };
    },
  };
  const context = {
    module: mockedModule,
    exports: mockedModule.exports,
    require(name) {
      if (name === 'server-only') return {};
      if (name === 'nodemailer') return nodemailer;
      if (name === '@/lib/constants') return { APP_NAME: 'LeadFlow' };
      return require(name);
    },
    process: { env, cwd: () => process.cwd() },
    fetch: async (url, opts) => {
      requests.push({ url, payload: JSON.parse(opts.body) });
      return { ok: responseOk, text: async () => 'mock error' };
    },
    Buffer,
    URL,
    URLSearchParams,
    console: { error() {} },
  };
  vm.runInNewContext(code, context, { filename: 'notify.ts' });
  return { api: mockedModule.exports, requests, smtpMessages };
}

async function main() {
  const settings = {
    APP_URL: 'https://leadflow-k926.vercel.app',
    CRM_ORGANIZATION_NAME: 'BuildPros',
    GMAIL_USER: 'buildpros@example.test',
    GMAIL_APP_PASS: 'test-only',
  };
  const invite = { to: 'recipient@example.test', subject: 'Invite', html: '<p>Hello</p>' };

  const sent = loadNotify({ ...settings, RESEND_API_KEY: 'test-only' });
  assert.equal(await sent.api.sendLeadFlowInvitationEmail(invite), true);
  assert.equal(sent.requests.length, 1);
  assert.equal(sent.requests[0].payload.from, 'LeadFlow <no-reply@leadflowcrm.info>');
  assert.equal(sent.smtpMessages.length, 0);

  const missing = loadNotify(settings);
  assert.equal(await missing.api.sendLeadFlowInvitationEmail(invite), false);
  assert.equal(missing.smtpMessages.length, 0, 'must not fall back to tenant Gmail');
  assert.equal(missing.requests.length, 0);

  const failed = loadNotify({ ...settings, RESEND_API_KEY: 'test-only' }, false);
  assert.equal(await failed.api.sendLeadFlowInvitationEmail(invite), false);
  assert.equal(failed.smtpMessages.length, 0, 'failed Resend must not fall back to tenant Gmail');

  const normal = loadNotify({ ...settings, RESEND_API_KEY: 'test-only' });
  assert.equal(await normal.api.sendEmail(invite), true);
  assert.equal(normal.requests[0].payload.from, 'BuildPros <no-reply@leadflow-k926.vercel.app>');

  const actions = fs.readFileSync(path.join(__dirname, '../src/lib/auth-actions.ts'), 'utf8');
  assert.equal((actions.match(/await sendLeadFlowInvitationEmail\(/g) || []).length, 3,
    'new user, workspace, and resent invitations must all use the safe sender');
  console.log('Invitation sender tests passed.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
