
import { formatKB } from './utils.js';
import {
  drawAuditChart,
  drawPassFailChart,
  drawXPTimeline,
  drawXPPerProject,
  drawSkillRadar,
  renderSkillList,
} from './svg.js';

const LOGIN_URL   = 'https://learn.reboot01.com/api/auth/signin';
const GRAPHQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

let token = '';

// ── Restore saved session (support legacy key and immediate activation)
const savedToken = localStorage.getItem('r01_token') || localStorage.getItem('r01_jwt');
if (savedToken) {
  token = savedToken;
  function activateAfterLoad() {
    const loginBox = document.getElementById('loginBox');
    const dashboard = document.getElementById('dashboard');
      if (loginBox) loginBox.hidden = true;
      // Render dashboard template into the container (if not already rendered)
      if (dashboard) {
        renderDashboardFromTemplate();
        dashboard.hidden = false;
      }
    showLoading(true);
    loadProfile();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activateAfterLoad);
  } else {
    activateAfterLoad();
  }
}

// ── Handle Enter key press in login form ──────────────────────────────────────
function handleLoginKeyPress(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    login();
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login() {
  const credential = document.getElementById('usernameInput').value.trim();
  const password   = document.getElementById('passwordInput').value;
  const errorEl    = document.getElementById('errorMsg');
  errorEl.textContent = '';

  if (!credential || !password) {
    errorEl.textContent = 'Please fill in both fields.';
    return;
  }

  const btn = document.querySelector('.login-box button');
  btn.textContent = 'Signing in…';
  btn.disabled = true;

  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(unescape(encodeURIComponent(credential + ':' + password)))}` }
    });

    if (res.status === 401 || res.status === 403) {
      errorEl.textContent = 'Invalid credentials. Please try again.';
      return;
    }
    if (!res.ok) {
      errorEl.textContent = `Login error (HTTP ${res.status}).`;
      return;
    }

    // API may return JWT as plain string or JSON-wrapped "eyJ..."
    let raw = await res.text();
    if (raw.startsWith('"') && raw.endsWith('"')) {
      try { raw = JSON.parse(raw); } catch { /* keep as-is */ }
    }
    token = raw.trim();

    if (!token || token.split('.').length !== 3) {
      errorEl.textContent = 'Invalid token received. Please try again.';
      return;
    }

    localStorage.setItem('r01_token', token);
    document.getElementById('loginBox').hidden  = true;
    renderDashboardFromTemplate();
    document.getElementById('dashboard').hidden = false;
    showLoading(true);
    loadProfile();

  } catch {
    errorEl.textContent = 'Network error. Check your connection.';
  } finally {
    btn.textContent = 'Sign In →';
    btn.disabled = false;
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('r01_token');
  token = '';
  document.getElementById('dashboard').hidden = true;
  const dashboard = document.getElementById('dashboard');
  if (dashboard) dashboard.innerHTML = '';
  document.getElementById('loginBox').hidden  = false;
  document.getElementById('errorMsg').textContent = '';
  document.getElementById('usernameInput').value  = '';
  document.getElementById('passwordInput').value  = '';
}

// Render the dashboard content from the template only after authentication
function renderDashboardFromTemplate() {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;
  // If already populated, do nothing
  if (dashboard.children.length > 0) return;
  const tpl = document.getElementById('dashboardTemplate');
  if (!tpl) return;
  const clone = tpl.content.cloneNode(true);
  dashboard.appendChild(clone);
}

// ── GraphQL helper ────────────────────────────────────────────────────────────
async function gql(query) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: {} }),
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    alert('Session expired — please sign in again.');
    return null;
  }

  const json = await res.json();
  if (json.errors) {
    console.error('[GQL error]', json.errors);
    throw new Error(json.errors.map(e => e.message).join('; '));
  }
  return json.data;
}

// ── Loading overlay ───────────────────────────────────────────────────────────
function showLoading(visible) {
  const el = document.getElementById('loadingOverlay');
  if (!el) return;
  if (visible) {
    el.style.display = 'flex';
    el.classList.remove('fade-out');
  } else {
    el.classList.add('fade-out');
    setTimeout(() => { el.style.display = 'none'; }, 450);
  }
}

// ── Main profile loader ───────────────────────────────────────────────────────
async function loadProfile() {
  try {

    // ────────────────────────────────────────────────────────────────────────
    // 1. USER INFO
    // ────────────────────────────────────────────────────────────────────────
    const userData = await gql(`{
      user {
        id
        login
      }
    }`);
    if (!userData) return;
    const user = userData.user[0];
    if (!user) { console.error('No user returned'); return; }

    setText('topbarLogin', user.login);
    const avatarEl = document.getElementById('headerAvatar');
    if (avatarEl) avatarEl.textContent = getInitials(user.login);

    // ────────────────────────────────────────────────────────────────────────
    // 2. TOTAL XP — ALL STUDENTS aggregate sum with correct path filters
    //    Filter: /bh-module/ path, exclude piscine except specific ones
    // ────────────────────────────────────────────────────────────────────────
    const xpAggData = await gql(`{
      transaction_aggregate(
        where: {
          type: { _eq: "xp" }
          path: { _like: "%/bh-module/%" }
          _or: [
            { path: { _nlike: "%/piscine%" } }
            { path: { _eq: "/bahrain/bh-module/piscine-js" } }
            { path: { _eq: "/bahrain/bh-module/piscine-rust" } }
          ]
        }
      ) {
        aggregate {
          sum { amount }
        }
      }
    }`);
    const totalXP = Number(xpAggData?.transaction_aggregate?.aggregate?.sum?.amount) || 0;
    console.log('Total XP (all students):', totalXP, 'formatted:', formatKB(totalXP));
    console.log('Raw aggregate data:', xpAggData);
    setText('statXP', formatKB(totalXP));
    setText('xpTotalBadge', formatKB(totalXP));

    // ────────────────────────────────────────────────────────────────────────
    // 3. AUDITS
    // ────────────────────────────────────────────────────────────────────────
    const auditData = await gql(`{
      Done: transaction_aggregate(
        where: {
          _and: [
            { userId: { _eq: ${user.id} } }
            { type: { _eq: "up" } }
          ]
        }
      ) {
        aggregate { sum { amount } }
      }

      Receive: transaction_aggregate(
        where: {
          _and: [
            { userId: { _eq: ${user.id} } }
            { type: { _eq: "down" } }
          ]
        }
      ) {
        aggregate { sum { amount } }
      }
    }`);

    const auditUp   = Math.abs(Number(auditData?.Done?.aggregate?.sum?.amount)    || 0);
    const auditDown = Math.abs(Number(auditData?.Receive?.aggregate?.sum?.amount) || 0);
    const ratio     = auditDown > 0 ? (auditUp / auditDown).toFixed(1) : '0.0';

    console.log('Audit stats:', { auditUp, auditDown, ratio });

    // Populate audit ratio card
    setText('statRatioValue', ratio);
    setText('auditDoneMini', formatKB(auditUp));
    setText('auditReceivedMini', formatKB(auditDown));

    // Draw the audit ratio donut chart
    drawAuditChart(auditUp, auditDown);

    // ────────────────────────────────────────────────────────────────────────
    // 4. PASS / FAIL - Using simplified result query (matches graph2)
    // ────────────────────────────────────────────────────────────────────────
    const resultData = await gql(`{
      result(
        where: { object: { type: { _eq: "project" } } }
      ) {
        grade
        object {
          name
        }
      }
    }`);

    const rows = resultData?.result || [];
    console.log(`Found ${rows.length} project result rows`);
    console.log('First 5 raw results:', rows.slice(0, 5));

    // Count pass/fail directly from results (no deduplication)
    let pass = 0;
    let fail = 0;
    
    rows.forEach(r => {
      if (!r.object?.name) return;
      
      // Skip piscine exercises
      if (r.object.name.toLowerCase().includes("piscine")) return;
      
      const grade = Number(r.grade) || 0;
      
      if (grade >= 1) {
        pass++;
      } else if (grade >= 0 && grade < 1) {
        fail++;
      }
    });

    console.log('Project stats (direct count):', { 
      pass, 
      fail, 
      total: pass + fail
    });

    const totalProjects = pass + fail;
    setText('passCount', pass);
    setText('passCount2', pass);
    setText('failCount', fail);
    setText('projectsTotal', totalProjects);
    setText('projectCount2', totalProjects);
    setText('xpProjectCount', totalProjects);
    
    // Animate XP progress bar
    setTimeout(() => {
      const xpBar = document.getElementById('xpProgressBar');
      if (xpBar) {
        const fillPercent = Math.min(100, (totalXP / 2000000) * 100);
        xpBar.style.width = fillPercent + '%';
      }
    }, 300);
    
    drawPassFailChart(pass, fail);

    // ────────────────────────────────────────────────────────────────────────
    // 6. SKILLS — count frequency per skill type (same as working sample)
    //    The working sample uses COUNT not sum of amount — more meaningful
    // ────────────────────────────────────────────────────────────────────────
    const skillData = await gql(`{
      transaction(
        where: {
          _and: [
            { userId: { _eq: ${user.id} } }
            { type: { _ilike: "skill_%" } }
          ]
        }
        limit: 10000
      ) {
        type
        amount
      }
    }`);

    // Count occurrences per skill name (matches working sample's buildSkills)
    const skillCount = {};
    (skillData?.transaction || []).forEach(t => {
      const name = t.type
        .replace(/^skill_/, '')
        .replace(/_/g, '-')
        .trim();
      if (!name) return;
      skillCount[name] = (skillCount[name] || 0) + 1;
    });

    const skills = Object.entries(skillCount)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
      // Removed .slice(0, 10) to show ALL skills

    console.log('Skills stats:', { 
      totalSkills: skills.length, 
      skillNames: skills.map(s => s.name),
      skillCounts: skills.map(s => s.amount)
    });

    setText('skillsTotal', skills.length);
    setText('radarSkillCount', skills.length);
    renderSkillList(skills);
    drawSkillRadar(skills);

    // ────────────────────────────────────────────────────────────────────────
    // 7. XP TIMELINE — ALL STUDENTS aggregated progression with correct path filters
    //    Filter: /bh-module/ path, exclude piscine except specific ones
    //    limit:10000 avoids Hasura default cap
    //    order_by createdAt asc for correct cumulative chart
    // ────────────────────────────────────────────────────────────────────────
    const xpTxData = await gql(`{
      transaction(
        where: {
          type: { _eq: "xp" }
          path: { _like: "%/bh-module/%" }
          _or: [
            { path: { _nlike: "%/piscine%" } }
            { path: { _eq: "/bahrain/bh-module/piscine-js" } }
            { path: { _eq: "/bahrain/bh-module/piscine-rust" } }
          ]
        }
        order_by: { createdAt: asc }
        limit: 10000
      ) {
        amount
        createdAt
        path
        objectId
      }
    }`);

    const xpTxns = xpTxData?.transaction || [];

    // Cumulative XP timeline for ALL students
    let cumul = 0;
    const timeline = xpTxns.map(t => {
      cumul += t.amount || 0;
      return { date: t.createdAt, xp: cumul };
    });
    drawXPTimeline(timeline);

    // ────────────────────────────────────────────────────────────────────────
    // 8. XP PER PROJECT — YOUR personal XP breakdown by project with path filters
    // ────────────────────────────────────────────────────────────────────────
    const myXpData = await gql(`{
      transaction(
        where: {
          _and: [
            { userId: { _eq: ${user.id} } }
            { type: { _eq: "xp" } }
            { path: { _like: "%/bh-module/%" } }
          ]
          _or: [
            { path: { _nlike: "%/piscine%" } }
            { path: { _eq: "/bahrain/bh-module/piscine-js" } }
            { path: { _eq: "/bahrain/bh-module/piscine-rust" } }
          ]
        }
        limit: 10000
      ) {
        amount
        path
        object { name }
      }
    }`);

    const myXpTxns = myXpData?.transaction || [];
    
    // XP per project — aggregate YOUR XP by project name
    const xpMap = {};
    myXpTxns.forEach(t => {
      const name = t.object?.name || t.path?.split('/').pop() || null;
      if (!name) return;
      xpMap[name] = (xpMap[name] || 0) + (t.amount || 0);
    });
    const xpProjects = Object.entries(xpMap)
      .map(([name, xp]) => ({ name, xp }))
      .sort((a, b) => b.xp - a.xp);
    drawXPPerProject(xpProjects);

  } catch (err) {
    console.error('[loadProfile error]', err);
  } finally {
    showLoading(false);
  }
}

// ── DOM helpers ───────────────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setStyle(id, prop, val) {
  const el = document.getElementById(id);
  if (el) el.style[prop] = val;
}

function getInitials(login) {
  if (!login) return '?';
  const parts = login.replace(/[^a-zA-Z\s\-_]/g, '').split(/[\s\-_]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (login[0] || '?').toUpperCase();
}

window.login  = login;
window.logout = logout;
window.handleLoginKeyPress = handleLoginKeyPress;