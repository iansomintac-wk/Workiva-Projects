// Local state for the real adapters (connect-ready §3.2). Every file here is git-ignored. Node built-ins only.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const DEFAULT_STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FILES = { proof: 'proof.json', tokens: 'gainsight-tokens.json', sent: 'sent-record.json', dryRun: 'dry-run.jsonl' };

export function resolveStateDir(dir) { return dir || process.env.CONNECTOR_STATE_DIR || DEFAULT_STATE_DIR; }

export function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Write a temp file, then rename, so a crash never leaves half a file. Throws on failure; the caller decides.
export function writeJsonAtomic(path, value, { writeFile = writeFileSync } = {}) {
  const tmp = `${path}.tmp`;
  writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(tmp, path);
}

export function tenantOf(slot, cfg = {}) {
  if (slot === 'gong') return { baseUrl: String(cfg.baseUrl || '').replace(/\/+$/, '') };
  if (slot === 'gainsight') {
    return { appUrl: String(cfg.appUrl || '').replace(/\/+$/, ''), apiBaseUrl: String(cfg.apiBaseUrl || cfg.appUrl || '').replace(/\/+$/, ''), tenantId: String(cfg.tenantId || '') };
  }
  throw new Error(`no tenant for slot ${slot}`);
}
export const sameTenant = (a, b) => !!a && !!b && JSON.stringify(a) === JSON.stringify(b);

export function loadProof(dir) { return readJson(join(resolveStateDir(dir), FILES.proof), {}); }
// /v1/health must not throw (T-14 F7): an unreadable proof.json reads as "no proof", so the adapter shows unproven.
// The write gate does NOT use this: it blocks on an unreadable file with its own message (write-gate.mjs).
export function loadProofSafe(dir) {
  try { const p = loadProof(dir); return p && typeof p === 'object' && !Array.isArray(p) ? p : {}; } catch { return {}; }
}
export function saveProof(dir, proof) { writeJsonAtomic(join(resolveStateDir(dir), FILES.proof), proof); }

// proof.json: {gong:{read}, gainsight:{read, write, unlock}}. A missing entry means "unproven".
export function recordProof(dir, slot, kind, { tenant, shapes = {}, environment = null, now = new Date() } = {}) {
  const proof = loadProof(dir);
  proof[slot] = { ...(proof[slot] || {}), [kind]: { state: 'proven', provenAt: now.toISOString(), tenant, environment, shapes } };
  saveProof(dir, proof);
  return proof;
}

// CR3: a proof recorded against another tenant is void.
export function isProven(proof, slot, kind, tenant) {
  const p = proof && proof[slot] && proof[slot][kind];
  return !!p && p.state === 'proven' && sameTenant(p.tenant, tenant);
}

// /v1/health strings (§3.2): "gong-rest (unproven)", "gainsight-rest (unproven, dry-run)", "gainsight-rest (dry-run)", "gainsight-rest".
export function healthName(base, { proven, dryRun = false }) {
  const flags = [];
  if (!proven) flags.push('unproven');
  if (dryRun) flags.push('dry-run');
  return flags.length ? `${base} (${flags.join(', ')})` : base;
}
