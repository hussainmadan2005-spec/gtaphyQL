// ═══════════════════════════════════════════
// api.js — GraphQL data fetching
// ═══════════════════════════════════════════

import { getToken, clearToken } from './auth.js';
import {
  USER_INFO,
  XP_TRANSACTIONS,
  CURRENT_LEVEL,
  AUDIT_TOTALS,
  PROJECT_RESULTS,
  SKILL_TRANSACTIONS,
  USER_PROGRESS,
} from './queries.js';

const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

export async function gql(query, variables = {}) {
  const token = getToken();

  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  // 401 / 403 means the JWT is expired or invalid → force logout
  if (res.status === 401 || res.status === 403) {
    clearToken();
    const err = new Error('SESSION_EXPIRED');
    err.sessionExpired = true;
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Network error: HTTP ${res.status}`);
  }

  const json = await res.json();

  // GraphQL returns errors in the `errors` array even with HTTP 200
  if (json.errors && json.errors.length > 0) {
    const msg = json.errors.map(e => e.message).join('; ');
    // Check if the error message indicates auth failure
    if (msg.toLowerCase().includes('jwt') || msg.toLowerCase().includes('unauthorized')) {
      clearToken();
      const err = new Error('SESSION_EXPIRED');
      err.sessionExpired = true;
      throw err;
    }
    throw new Error(`GraphQL error: ${msg}`);
  }

  if (!json.data) {
    throw new Error('Empty response from GraphQL server.');
  }

  return json.data;
}

// ── Individual data-fetch functions ──────────────────────────────────────────

/**
 * Fetch basic user info (id, login).
 * Returns the first user object or null.
 */
export async function fetchUserInfo() {
  const data = await gql(USER_INFO);
  const users = data.user || [];
  return users[0] || null;
}

/**
 * Fetch all XP transactions ordered by date ascending.
 * Returns an array of { id, amount, createdAt, path, object }.
 */
export async function fetchXpTransactions() {
  const data = await gql(XP_TRANSACTIONS);
  return data.transaction || [];
}

/**
 * Fetch the current level (most recent "level" transaction).
 * Returns the level number (amount) or 0.
 */
export async function fetchCurrentLevel() {
  const data = await gql(CURRENT_LEVEL);
  const rows = data.transaction || [];
  return rows[0]?.amount ?? 0;
}

/**
 * Fetch audit totals (given and received sums).
 * Returns { given: number, received: number, ratio: number }.
 */
export async function fetchAuditTotals() {
  const data = await gql(AUDIT_TOTALS);
  const given    = data.given?.aggregate?.sum?.amount    ?? 0;
  const received = data.received?.aggregate?.sum?.amount ?? 0;
  const ratio    = received > 0 ? given / received : 0;
  return { given, received, ratio };
}

/**
 * Fetch all project results with nested object info.
 * Returns array of { id, grade, createdAt, updatedAt, object }.
 */
export async function fetchProjectResults() {
  const data = await gql(PROJECT_RESULTS);
  return data.result || [];
}

/**
 * Fetch skill transactions (type starts with "skill_").
 * Returns array of { type, amount }.
 */
export async function fetchSkillTransactions() {
  const data = await gql(SKILL_TRANSACTIONS);
  return data.transaction || [];
}

/**
 * Fetch user progress data (completed attempts).
 * Returns array of { id, grade, createdAt, updatedAt, object }.
 */
export async function fetchUserProgress() {
  const data = await gql(USER_PROGRESS);
  return data.progress || [];
}

// ── Aggregate / derived data functions ───────────────────────────────────────

/**
 * Build a pass/fail summary from raw result rows.
 * Counts results where grade >= 1 as "pass", below 1 as "fail".
 * Skips rows where the object is missing or is an exercise type.
 *
 * Returns { pass: number, fail: number }.
 */
export function summarizeResults(results) {
  let pass = 0, fail = 0;
  for (const r of results) {
    // Skip results without a valid object
    if (!r.object) continue;
    // Optionally skip pure exercise objects
    if (r.object.type === 'exercise') continue;
    if (r.grade >= 1) {
      pass++;
    } else {
      fail++;
    }
  }
  return { pass, fail };
}

/**
 * Build cumulative XP data points from XP transactions.
 * Returns array of { date: string, xp: number } sorted by date.
 */
export function buildXpTimeline(xpTransactions) {
  let cumulative = 0;
  return xpTransactions
    .filter(t => t.createdAt)
    .map(t => {
      cumulative += t.amount || 0;
      return { date: t.createdAt, xp: cumulative };
    });
}

/**
 * Build XP-per-project aggregation from XP transactions.
 * Groups by project name, sums XP, sorts descending.
 * Returns array of { name: string, xp: number }.
 */
export function buildXpPerProject(xpTransactions) {
  const map = {};
  for (const t of xpTransactions) {
    const name = t.object?.name || t.path?.split('/').pop() || 'unknown';
    if (!map[name]) map[name] = 0;
    map[name] += t.amount || 0;
  }
  return Object.entries(map)
    .map(([name, xp]) => ({ name, xp }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 15); // top 15 projects max
}

/**
 * Build a ranked skills list from skill transactions.
 * Groups by skill name, keeps the highest amount per skill.
 * Returns array of { name: string, amount: number } sorted descending.
 */
export function buildSkillsList(skillTransactions) {
  const map = {};
  for (const t of skillTransactions) {
    // Strip "skill_" prefix to get readable name
    const name = t.type.replace(/^skill_/, '').replace(/-/g, ' ');
    // Keep highest value seen for this skill
    if (!map[name] || t.amount > map[name]) {
      map[name] = t.amount;
    }
  }
  return Object.entries(map)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8); // top 8 skills
}

/**
 * Sum all XP transaction amounts.
 */
export function totalXp(xpTransactions) {
  return xpTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
}
