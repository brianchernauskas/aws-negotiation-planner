'use strict';

// ─── State ───────────────────────────────────────────────────────────────────
const state = {};
let currentStep = 1;

// ─── Navigation ──────────────────────────────────────────────────────────────
function nextStep(from) {
  if (!validateStep(from)) return;
  collectStep(from);
  goToStep(from + 1);
}
function prevStep(from) {
  goToStep(from - 1);
}
function goToStep(n) {
  document.querySelector('.step-panel.active')?.classList.remove('active');
  document.getElementById(`step-${n}`).classList.add('active');
  document.querySelectorAll('.step-item').forEach(el => {
    const s = +el.dataset.step;
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
  });
  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateStep(step) {
  const required = {
    1: ['company-size', 'industry', 'growth-rate', 'aws-tenure', 'contract-type'],
    2: ['annual-spend', 'spend-growth', 'renewal-timeline'],
    3: ['workload-type', 'regions', 'optimization-status'],
    4: ['multicloud', 'relationship-quality', 'negotiation-goals'],
  };
  const fields = required[step] || [];
  let ok = true;
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) {
      // radio-card group
      const group = document.getElementById(id);
      if (group && !group.querySelector('.selected')) {
        highlightMissing(group);
        ok = false;
      }
      return;
    }
    if (el.tagName === 'SELECT' && !el.value) {
      el.style.borderColor = 'var(--danger)';
      el.addEventListener('change', () => el.style.borderColor = '', { once: true });
      ok = false;
    }
  });
  // radio-card groups
  const radioGroups = {
    1: ['company-size'],
    4: ['multicloud'],
  };
  (radioGroups[step] || []).forEach(id => {
    const group = document.getElementById(id);
    if (group && !group.querySelector('.selected')) {
      group.style.outline = '2px solid var(--danger)';
      group.style.borderRadius = '8px';
      setTimeout(() => { group.style.outline = ''; }, 2000);
      ok = false;
    }
  });
  if (!ok) {
    const msg = document.createElement('div');
    msg.className = 'alert alert-danger';
    msg.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;max-width:320px;animation:fadeIn .2s ease';
    msg.innerHTML = '<span class="alert-icon">⚠️</span> Please fill in all required fields before continuing.';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }
  return ok;
}

// ─── Data Collection ──────────────────────────────────────────────────────────
function collectStep(step) {
  if (step === 1) {
    state.companySize = document.querySelector('#company-size .selected')?.dataset.value;
    state.industry = document.getElementById('industry').value;
    state.growthRate = document.getElementById('growth-rate').value;
    state.awsTenure = document.getElementById('aws-tenure').value;
    state.contractType = document.getElementById('contract-type').value;
    state.compliance = [...document.querySelectorAll('#compliance input:checked')].map(i => i.value);
  }
  if (step === 2) {
    state.annualSpend = document.getElementById('annual-spend').value;
    state.spendGrowth = document.getElementById('spend-growth').value;
    state.renewalTimeline = document.getElementById('renewal-timeline').value;
    state.desiredTerm = document.getElementById('desired-term').value;
    state.marketplaceSpend = document.getElementById('marketplace-spend')?.value || 'none';
    state.databaseSavingsPlans = document.getElementById('database-savings-plans')?.value || 'none';
    state.edpMonthsRemaining = document.getElementById('edp-months-remaining')?.value || 'na';
    state.commitUtilization = document.getElementById('commit-utilization').value;
    state.currentDiscounts = [...document.querySelectorAll('.current-discounts:checked')].map(i => i.value);
    state.supportTier = document.getElementById('support-tier').value;
  }
  if (step === 3) {
    state.useCases = [...document.querySelectorAll('#use-cases .selected')].map(c => c.dataset.value);
    state.workloadType = document.getElementById('workload-type').value;
    state.regions = document.getElementById('regions').value;
    state.spendConcentration = document.getElementById('spend-concentration').value;
    state.optimizationStatus = document.getElementById('optimization-status').value;
  }
  if (step === 4) {
    state.multicloud = document.querySelector('#multicloud .selected')?.dataset.value;
    state.relationshipQuality = document.getElementById('relationship-quality').value;
    state.previousNegotiation = document.getElementById('previous-negotiation').value;
    state.migrationPlans = [...document.querySelectorAll('#migration-plans input:checked')].map(i => i.value);
    state.negotiationGoals = document.getElementById('negotiation-goals').value;
    state.internalChampion = document.getElementById('internal-champion').value;
    state.awsPrograms = [...document.querySelectorAll('#aws-programs input:checked')].map(i => i.value);
  }
}

// ─── Radio Cards & Use Case Cards ────────────────────────────────────────────
document.querySelectorAll('.radio-cards').forEach(group => {
  group.querySelectorAll('.radio-card').forEach(card => {
    card.addEventListener('click', () => {
      group.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
});
document.querySelectorAll('.use-case-card').forEach(card => {
  card.addEventListener('click', () => card.classList.toggle('selected'));
});

// ─── Strategy Generation ──────────────────────────────────────────────────────
function generateStrategy() {
  if (!validateStep(4)) return;
  collectStep(4);
  const html = buildStrategyHTML(state);
  document.getElementById('strategy-output').innerHTML = html;
  goToStep(5);
}

// ─── Spend Tier Logic ─────────────────────────────────────────────────────────
const SPEND_TIERS = {
  'under100k': { label: '<$100K', min: 0, max: 100000, tier: 0 },
  '100k-500k': { label: '$100K–$500K', min: 100000, max: 500000, tier: 1 },
  '500k-1m':   { label: '$500K–$1M', min: 500000, max: 1000000, tier: 2 },
  '1m-2m':     { label: '$1M–$2M', min: 1000000, max: 2000000, tier: 3 },
  '2m-5m':     { label: '$2M–$5M', min: 2000000, max: 5000000, tier: 4 },
  '5m-10m':    { label: '$5M–$10M', min: 5000000, max: 10000000, tier: 5 },
  '10m-25m':   { label: '$10M–$25M', min: 10000000, max: 25000000, tier: 6 },
  '25m-50m':   { label: '$25M–$50M', min: 25000000, max: 50000000, tier: 7 },
  '50mplus':   { label: '$50M+', min: 50000000, max: Infinity, tier: 8 },
};

function getDiscountRange(s) {
  const tier = SPEND_TIERS[s.annualSpend]?.tier ?? 0;
  const multicloudBoost = s.multicloud === 'multi-cloud' ? 8 : s.multicloud === 'evaluating' ? 5 : s.multicloud === 'aws-primary' ? 2 : 0;
  const termBoost = s.desiredTerm === '3yr' ? 5 : s.desiredTerm === '2yr' ? 3 : 0;
  const growthBoost = s.growthRate === 'hypergrowth' ? 3 : s.growthRate === 'fast' ? 2 : 0;
  const marketplaceBoost = s.marketplaceSpend === '500kplus' ? 4 : s.marketplaceSpend === '100k-500k' ? 2 : 0;

  const ranges = [
    [0, 2],   // <$100K
    [0, 5],   // $100K–$500K
    [3, 9],   // $500K–$1M
    [6, 14],  // $1M–$2M
    [10, 20], // $2M–$5M
    [15, 28], // $5M–$10M
    [18, 32], // $10M–$25M
    [22, 38], // $25M–$50M
    [25, 45], // $50M+
  ];
  const [lo, hi] = ranges[tier] || [0, 2];
  const loFinal = Math.min(lo + Math.round(multicloudBoost * 0.4) + Math.round(termBoost * 0.4), 45);
  const hiFinal = Math.min(hi + multicloudBoost + termBoost + growthBoost + marketplaceBoost, 50);
  return { lo: loFinal, hi: hiFinal, midpoint: Math.round((loFinal + hiFinal) / 2) };
}

function getLeverageScore(s) {
  let score = 0;
  // Spend tier (0–30 pts)
  score += (SPEND_TIERS[s.annualSpend]?.tier ?? 0) * 3.5;
  // Multi-cloud (0–20)
  if (s.multicloud === 'multi-cloud') score += 20;
  else if (s.multicloud === 'evaluating') score += 14;
  else if (s.multicloud === 'aws-primary') score += 6;
  // Growth (0–15)
  const growthMap = { hypergrowth: 15, fast: 11, moderate: 7, slow: 3, declining: 0 };
  score += growthMap[s.growthRate] ?? 5;
  // Timing (0–10)
  const timingMap = { '6-12mo': 10, '3-6mo': 7, '12plusmo': 5, '1-3mo': 3, 'within-1mo': 0 };
  score += timingMap[s.renewalTimeline] ?? 5;
  // Relationship (0–10)
  const relMap = { strategic: 10, strong: 8, moderate: 5, poor: 2, none: 0 };
  score += relMap[s.relationshipQuality] ?? 3;
  // Tenure (0–5)
  const tenureMap = { '5plus': 5, '3-5': 4, '1-3': 2, 'new': 0 };
  score += tenureMap[s.awsTenure] ?? 2;
  // Marketplace spend — now counts toward EDP drawdown
  if (s.marketplaceSpend === '500kplus') score += 6;
  else if (s.marketplaceSpend === '100k-500k') score += 3;
  // Database Savings Plans — uncaptured discount lever
  if (s.databaseSavingsPlans && s.databaseSavingsPlans !== 'none') score += 4;
  if (s.databaseSavingsPlans === 'multiple') score += 2;
  // EDP timing — penalize urgency
  const edpTimingMap = { 'under3': -12, '3-6': -5, '6-12': 6, '12plus': 10, 'na': 0 };
  score += edpTimingMap[s.edpMonthsRemaining] ?? 0;
  return Math.min(Math.round(score), 100);
}

function getLeverageLabel(score) {
  if (score >= 75) return { label: 'Very Strong', color: '#166534' };
  if (score >= 55) return { label: 'Strong', color: '#15803D' };
  if (score >= 35) return { label: 'Moderate', color: '#B45309' };
  if (score >= 15) return { label: 'Developing', color: '#9A3412' };
  return { label: 'Early Stage', color: '#6B7280' };
}

// ─── Main Strategy Builder ────────────────────────────────────────────────────
function buildStrategyHTML(s) {
  const discount = getDiscountRange(s);
  const leverage = getLeverageScore(s);
  const leverageInfo = getLeverageLabel(leverage);
  const spendLabel = SPEND_TIERS[s.annualSpend]?.label ?? 'Unknown';
  const tier = SPEND_TIERS[s.annualSpend]?.tier ?? 0;
  const companyLabels = { startup: 'Startup', smb: 'SMB', midmarket: 'Mid-Market', enterprise: 'Enterprise' };

  const tactics = buildTactics(s, tier);
  const timeline = buildTimeline(s);
  const concessions = buildConcessions(s, tier);
  const risks = buildRisks(s, tier);
  const questions = buildQuestions(s, tier);
  const alerts = buildAlerts(s, tier);

  return `
<div class="strategy-container">
  <div class="print-proxima-header">
    <span class="print-logo-text">Proxima</span>
    <span class="print-divider"></span>
    <span class="print-tool-name">AWS Negotiation Planner</span>
  </div>
  <div class="strategy-hero">
    <h2>Your AWS Negotiation Strategy</h2>
    <div class="subtitle">${companyLabels[s.companySize] || 'Company'} · ${spendLabel} annual spend · Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
    <div style="font-size:.75rem;color:rgba(255,255,255,.6);font-style:italic;margin-top:4px;">Intended for Proxima use only — please contact Brian Chernauskas with questions</div>
    <div class="score-row">
      <div class="score-pill">
        <span class="pill-label">Leverage Score</span>
        <span class="pill-value" style="color:${leverageInfo.color}">${leverage}/100 — ${leverageInfo.label}</span>
      </div>
      <div class="score-pill">
        <span class="pill-label">Target Discount</span>
        <span class="pill-value">${discount.lo}–${discount.hi}%</span>
      </div>
      <div class="score-pill">
        <span class="pill-label">Contract Type</span>
        <span class="pill-value">${recommendedContractType(s, tier)}</span>
      </div>
    </div>
  </div>

  <div class="strategy-body">

    ${alerts.length ? `
    <div class="strategy-section">
      <div class="section-header">
        <span class="section-icon">🚨</span>
        <h3>Critical Flags & Immediate Actions</h3>
      </div>
      <div class="section-content">
        <div class="alerts-list">${alerts.map(a => `<div class="alert alert-${a.type}"><span class="alert-icon">${a.icon}</span><div>${a.text}</div></div>`).join('')}</div>
      </div>
    </div>` : ''}

    <div class="strategy-section">
      <div class="section-header">
        <span class="section-icon">💰</span>
        <h3>Expected Discount Range</h3>
        <span class="section-badge">${recommendedContractType(s, tier)}</span>
      </div>
      <div class="section-content">
        <div class="discount-estimate">
          <div>
            <div class="de-range">${discount.lo}–${discount.hi}%</div>
            <div class="de-label">vs. on-demand list price</div>
          </div>
          <div class="de-bar-wrap">
            <div class="de-bar-bg">
              <div class="de-bar-fill" style="width:${Math.min(discount.hi * 2, 100)}%"></div>
            </div>
            <div class="de-note">Midpoint target: <strong>${discount.midpoint}%</strong> · Walk-away floor: <strong>${discount.lo}%</strong> · Stretch goal: <strong>${discount.hi}%</strong></div>
          </div>
        </div>
        ${discountBreakdownHTML(s, tier, discount)}
      </div>
    </div>

    <div class="strategy-section">
      <div class="section-header">
        <span class="section-icon">🎯</span>
        <h3>Negotiation Tactics — Ranked by Impact</h3>
        <span class="section-badge blue">${tactics.length} tactics</span>
      </div>
      <div class="section-content">
        <div class="tactics-list">${tactics.map((t, i) => `
          <div class="tactic-card">
            <div class="tactic-num">${i + 1}</div>
            <div class="tactic-body">
              <div class="tactic-title">${t.title}</div>
              <div class="tactic-desc">${t.desc}</div>
              <span class="tactic-impact impact-${t.impact}">${t.impact === 'high' ? '🔥 High Impact' : t.impact === 'medium' ? '⚡ Medium Impact' : '• Low Impact'}</span>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="strategy-section">
      <div class="section-header">
        <span class="section-icon">🎁</span>
        <h3>Concessions to Request (Beyond Headline Discount)</h3>
        <span class="section-badge green">Non-discount value</span>
      </div>
      <div class="section-content">
        <div class="concessions-grid">${concessions.map(c => `
          <div class="concession-card">
            <div class="cc-icon">${c.icon}</div>
            <div class="cc-title">${c.title}</div>
            <div class="cc-desc">${c.desc}</div>
            <div class="cc-priority priority-${c.priority}">${c.priority === 'must' ? '🔴 Must Have' : c.priority === 'should' ? '🟡 Should Have' : '⚪ Nice to Have'}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="strategy-section">
      <div class="section-header">
        <span class="section-icon">📅</span>
        <h3>Negotiation Timeline & Action Plan</h3>
      </div>
      <div class="section-content">
        <div class="timeline">${timeline.map(t => `
          <div class="timeline-item">
            <div class="timeline-left">
              <div class="tl-dot">${t.phase}</div>
              <div class="tl-line"></div>
            </div>
            <div class="tl-content">
              <div class="tl-phase">${t.when}</div>
              <div class="tl-title">${t.title}</div>
              <div class="tl-desc">${t.desc}</div>
              <div class="tl-tasks">${t.tasks.map(task => `<div class="tl-task">${task}</div>`).join('')}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="strategy-section">
      <div class="section-header">
        <span class="section-icon">💬</span>
        <h3>Questions to Ask AWS in the First Meeting</h3>
      </div>
      <div class="section-content">
        <div class="questions-list">${questions.map(q => `<div class="question-item">"${q}"</div>`).join('')}</div>
      </div>
    </div>

    <div class="strategy-section">
      <div class="section-header">
        <span class="section-icon">⚠️</span>
        <h3>Risk Factors & Mitigations</h3>
      </div>
      <div class="section-content">
        <div class="risk-grid">${risks.map(r => `
          <div class="risk-card ${r.level}">
            <div class="risk-title">${r.title}</div>
            <div class="risk-desc">${r.desc}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    ${buildCommitStructureHTML(s, tier)}

  </div>
  <div class="proxima-strategy-footer" style="margin-top:32px;padding-top:16px;border-top:1px solid var(--border);text-align:center;font-size:.78rem;color:var(--text-muted);font-style:italic;">
    Intended for Proxima use only — please contact Brian Chernauskas with questions
  </div>
</div>`;
}

// ─── Section Builders ─────────────────────────────────────────────────────────

function recommendedContractType(s, tier) {
  if (tier >= 5) return 'EDP / PPA';
  if (tier >= 3) return 'EDP';
  if (tier >= 2) return 'EDP or Savings Plans';
  if (tier >= 1) return 'Savings Plans';
  return 'Savings Plans / On-Demand';
}

function discountBreakdownHTML(s, tier, discount) {
  const rows = [];
  if (s.multicloud === 'multi-cloud') rows.push(['Multi-cloud positioning', '+5–10%', 'green']);
  else if (s.multicloud === 'evaluating') rows.push(['Evaluating Azure/GCP (active RFP)', '+3–7%', 'green']);
  if (s.desiredTerm === '3yr') rows.push(['3-year commitment term', '+3–5%', 'green']);
  else if (s.desiredTerm === '2yr') rows.push(['2-year commitment term', '+1–3%', 'green']);
  if (s.growthRate === 'hypergrowth' || s.growthRate === 'fast') rows.push(['High-growth trajectory (future revenue)', '+1–4%', 'green']);
  if (tier >= 3 && s.supportTier === 'enterprise') rows.push(['Enterprise Support negotiation', '−1–3% on support', 'green']);
  if (s.commitUtilization === 'over100') rows.push(['Exceeded prior commitment (strong signal)', '+1–2%', 'green']);
  if (s.commitUtilization === 'under70') rows.push(['Prior shortfall — expect reduced flexibility', '−2–5%', 'red']);
  if (s.awsTenure === '5plus') rows.push(['Long-tenured customer (loyalty)', '+0–2%', 'green']);
  if (s.marketplaceSpend === '500kplus') rows.push(['Significant Marketplace spend — counts toward EDP drawdown', '+2–4%', 'green']);
  else if (s.marketplaceSpend === '100k-500k') rows.push(['Marketplace spend — can be included in EDP commitment', '+1–2%', 'green']);
  if (!rows.length) return '';
  return `<table style="width:100%;margin-top:16px;border-collapse:collapse;font-size:.82rem;">
    <thead><tr style="border-bottom:1px solid var(--border);">
      <th style="text-align:left;padding:6px 0;color:var(--text-secondary);font-weight:600;">Factor</th>
      <th style="text-align:right;padding:6px 0;color:var(--text-secondary);font-weight:600;">Impact</th>
    </tr></thead>
    <tbody>${rows.map(([label, val, color]) => `<tr style="border-bottom:1px solid var(--surface-3);">
      <td style="padding:7px 0;color:var(--text-primary);">${label}</td>
      <td style="padding:7px 0;text-align:right;font-weight:700;color:var(--${color === 'red' ? 'danger' : 'success'})">${val}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

function buildTactics(s, tier) {
  const tactics = [];

  // Marketplace as EDP currency
  if (s.databaseSavingsPlans && s.databaseSavingsPlans !== 'none') {
    tactics.push({
      title: 'Negotiate Database Savings Plans as a Separate Workstream',
      desc: `AWS Database Savings Plans (launched Dec 2025) cover Aurora Serverless, DocumentDB, Neptune, Keyspaces, and Timestream at 12–35% discounts on 1-year no-upfront terms. These are almost never included in AWS\'s initial EDP proposal. Raise them proactively as a separate negotiation item and request they be bundled into your EDP credit package or offered as standalone Plans — either way, this adds material value at no additional commit.`,
      impact: 'high',
    });
  }
  if (s.edpMonthsRemaining === 'under3' || s.edpMonthsRemaining === '3-6') {
    tactics.push({
      title: 'Request a Short-Term Extension to Reset the Clock',
      desc: 'With limited time remaining on your EDP, your first action should be requesting a 60–90 day extension of current terms — not signing a new agreement under deadline pressure. AWS will generally grant this, and it shifts the power dynamic back toward you. A negotiation with 6 months of runway achieves meaningfully better outcomes than one with 6 weeks.',
      impact: 'high',
    });
  }
  if (s.marketplaceSpend === '500kplus' || s.marketplaceSpend === '100k-500k') {
    tactics.push({
      title: 'Include AWS Marketplace Spend in Your EDP Commitment',
      desc: `AWS Marketplace purchases now count toward EDP drawdown — ISV software, managed services, and third-party tools purchased through Marketplace can all be credited against your EDP commitment. With your current Marketplace spend, this meaningfully increases the effective size of your EDP, potentially pushing you into a higher discount tier without increasing AWS infrastructure spend. Explicitly require Marketplace inclusion language in your EDP agreement, as it is not automatic on all contracts.`,
      impact: 'high',
    });
  }

  // Multi-cloud leverage
  if (s.multicloud === 'aws-only') {
    tactics.push({
      title: 'Launch a Competitive Cloud Evaluation (Even if You Stay on AWS)',
      desc: 'Request formal pricing from Azure and GCP for 2–3 key workloads. You don\'t need to move — the credible threat of moving is your single most powerful lever. AWS account teams are measured on preventing churn. Even a preliminary GCP/Azure quote unlocks 5–10 percentage points of additional discount.',
      impact: 'high',
    });
  } else if (s.multicloud === 'multi-cloud' || s.multicloud === 'evaluating') {
    tactics.push({
      title: 'Leverage Your Multi-Cloud Position Explicitly',
      desc: 'Open negotiations by quantifying what percentage of compute currently runs on Azure/GCP. Frame the EDP negotiation as "the discount required to consolidate more workloads onto AWS." AWS will reward consolidation — make them earn it.',
      impact: 'high',
    });
  }

  // Timing
  if (s.renewalTimeline === '6-12mo' || s.renewalTimeline === '12plusmo') {
    tactics.push({
      title: 'Time Outreach to AWS Fiscal Quarter-End',
      desc: 'AWS\'s fiscal quarters end March 31, June 30, September 30, December 31. Account teams have quarterly revenue targets. Negotiations initiated 4–6 weeks before quarter-end and closed in the final days receive measurably better terms — additional credits, deeper discounts, and contract flexibility that isn\'t available mid-quarter.',
      impact: 'high',
    });
  } else if (s.renewalTimeline === 'within-1mo' || s.renewalTimeline === '1-3mo') {
    tactics.push({
      title: 'Create Urgency — Request a 90-Day Extension While Negotiating',
      desc: 'You\'re in a tight window. Request a short-term extension of existing terms to avoid negotiating under pressure. Use the extension period to optimize spend (reduces your baseline) and prepare competitive alternatives before signing anything new.',
      impact: 'high',
    });
  }

  // Optimization
  if (s.optimizationStatus === 'unoptimized' || s.optimizationStatus === 'partially') {
    tactics.push({
      title: 'Optimize Before You Commit — Right-Size First',
      desc: 'Unoptimized infrastructure inflates your committed spend baseline. Run AWS Compute Optimizer and Cost Explorer\'s rightsizing recommendations first. A 20–35% spend reduction achieved before committing means you commit on a lower, sustainable number — dramatically reducing overcommitment risk. Then negotiate the commitment on the optimized baseline.',
      impact: 'high',
    });
  }

  // Commit level
  if (tier >= 2) {
    tactics.push({
      title: 'Anchor Commitment at 80–85% of Projected Spend',
      desc: 'Never commit to 100% of projected spend. Model conservative, moderate, and aggressive scenarios. Commit at 80–85% of the moderate scenario. This gives you shortfall protection while demonstrating credible commitment. Negotiate a "ramp" structure where commitment grows 10–15% per year rather than a flat obligation.',
      impact: 'high',
    });
  }

  // Support negotiation
  if (tier >= 4 && (s.supportTier === 'enterprise' || s.supportTier === 'enterprise-on-ramp')) {
    tactics.push({
      title: 'Negotiate Enterprise Support Rate Down from 10% to 7–8%',
      desc: 'At your spend level, the 10% Enterprise Support rate is negotiable. Request reduction to 7–8% as part of the EDP. This alone saves 2–3% of total spend — equivalent to a significant discount improvement. Push for support rate caps (absolute dollar maximums) to protect against spend growth inflating support costs.',
      impact: 'high',
    });
  }

  // Marketplace inclusion
  if (tier >= 3) {
    tactics.push({
      title: 'Negotiate AWS Marketplace Inclusion in Your EDP Commitment',
      desc: 'Up to 25% of your EDP commitment can be satisfied through AWS Marketplace purchases (third-party software). This gives you flexibility to use SaaS tools you already buy while burning down your AWS commitment. Negotiate the marketplace inclusion rate upfront — it\'s often left out of first-draft agreements.',
      impact: 'medium',
    });
  }

  // Credits
  if (s.migrationPlans.includes('migrating-to-aws') || s.migrationPlans.includes('onprem-exit')) {
    tactics.push({
      title: 'Request Migration Acceleration Program (MAP) Credits',
      desc: 'AWS MAP provides credits to offset migration costs. If you\'re migrating workloads to AWS, you\'re eligible for substantial MAP credits (often $50K–$500K+ depending on scope). These are separate from EDP discounts — always negotiate them as an add-on, not a substitute for discount.',
      impact: 'high',
    });
  }

  // Bundle accounts
  if (s.companySize === 'enterprise' || s.companySize === 'midmarket') {
    tactics.push({
      title: 'Consolidate All Linked Accounts Under One EDP',
      desc: 'Aggregate spend from subsidiaries, business units, and dev/test accounts under a single AWS Organizations management account before entering negotiation. Higher aggregated spend unlocks better discount tiers. Many companies leave 10–20% in discount improvement on the table by negotiating siloed accounts.',
      impact: 'medium',
    });
  }

  // Carry-forward
  tactics.push({
    title: 'Negotiate Carry-Forward and Shortfall Protections',
    desc: 'Insist on carry-forward provisions: unused commitment in Year 1 rolls into Year 2 rather than being forfeited. Also negotiate shortfall language — some agreements require you to pay for unused commitment at 100 cents on the dollar. Push for unused commitment to be credited toward future commitments or converted to credits.',
    impact: 'medium',
  });

  // Savings plans stacking
  if (tier >= 2) {
    tactics.push({
      title: 'Stack Compute Savings Plans on Top of EDP',
      desc: 'EDP discounts and Compute Savings Plans are not mutually exclusive. Compute Savings Plans applied on top of EDP pricing can deliver an additional 20–40% discount on qualifying compute. Negotiate explicit language in your EDP allowing Savings Plans to apply to EDP-discounted rates.',
      impact: 'medium',
    });
  }

  // Professional services
  if (tier >= 3) {
    tactics.push({
      title: 'Request Funded Professional Services and Training Credits',
      desc: 'AWS will often include $25K–$100K in AWS Professional Services time, training credits, and proof-of-concept funding as part of a larger EDP. Ask specifically for: training credits for team certification, funded well-architected reviews, and a dedicated Solutions Architect allocation. These have real dollar value beyond the headline discount.',
      impact: 'medium',
    });
  }

  // Growth narrative
  if (s.growthRate === 'hypergrowth' || s.growthRate === 'fast' || s.spendGrowth === 'hypergrowth' || s.spendGrowth === 'fast') {
    tactics.push({
      title: 'Build a Growth Narrative with Documented Projections',
      desc: 'AWS discounts today\'s spend but bets on tomorrow\'s. Prepare a 3-year cloud spend projection with supporting business data (customer growth, new products, infrastructure roadmap). Present AWS as a strategic partner in your growth, not just a vendor. Commit at a level that reflects future spend — higher commits unlock better tiers even if current spend is lower.',
      impact: 'medium',
    });
  }

  // Industry-specific
  if (s.compliance.includes('fedramp') || s.industry === 'government') {
    tactics.push({
      title: 'Leverage GovCloud / FedRAMP Requirements as Differentiation',
      desc: 'Your regulatory requirements make you a strategically important customer — AWS GovCloud expertise and compliance investments are a moat for AWS. Use this to request dedicated support resources, accelerated compliance reviews, and enhanced SLAs as part of your EDP. AWS will invest more in retaining FedRAMP-compliant workloads.',
      impact: 'medium',
    });
  }

  if (s.useCases.includes('ml-ai') && tier >= 3) {
    tactics.push({
      title: 'Negotiate Bedrock / SageMaker Credits for AI Workloads',
      desc: 'AI/ML is AWS\'s fastest-growing segment and they actively subsidize adoption. Request dedicated Bedrock and SageMaker credits as part of your EDP — especially if you\'re evaluating or expanding AI use cases. AWS will often provide $50K–$250K in service-specific credits to lock in AI workloads vs. Azure OpenAI or GCP Vertex.',
      impact: 'medium',
    });
  }

  // BATNA
  tactics.push({
    title: 'Establish Your BATNA Before the First Meeting',
    desc: 'Know your Best Alternative To a Negotiated Agreement before talking to AWS. If AWS doesn\'t improve terms: can you extend month-to-month? Convert to pure on-demand + Savings Plans without an EDP? Move a workload to GCP? Having a realistic fallback prevents you from accepting bad terms under pressure. Never negotiate without a credible walk-away.',
    impact: 'low',
  });

  return tactics.slice(0, 10);
}

function buildTimeline(s) {
  const isUrgent = s.renewalTimeline === 'within-1mo' || s.renewalTimeline === '1-3mo';
  const isIdeal = s.renewalTimeline === '6-12mo' || s.renewalTimeline === '12plusmo';

  const phases = [
    {
      phase: 'P1',
      when: isUrgent ? 'Week 1 (Immediate)' : 'Months 6–9 Before Renewal',
      title: 'Preparation & Baseline Establishment',
      desc: 'Do your homework before AWS does theirs. This phase determines your entire negotiating position.',
      tasks: [
        'Run AWS Cost Explorer and Compute Optimizer — document all rightsizing opportunities',
        'Pull 12-month spend breakdown by service, account, and region',
        'Identify your top 5 services by cost and model optimized spend',
        'Draft conservative, moderate, and aggressive 3-year spend projections',
        'List all workloads that could realistically move to Azure/GCP (your BATNA)',
      ],
    },
    {
      phase: 'P2',
      when: isUrgent ? 'Week 1–2' : 'Months 4–6 Before Renewal',
      title: 'Competitive Intelligence & Alternative Quotes',
      desc: 'Get real competitive quotes — even if you\'re not planning to switch, you need them at the table.',
      tasks: [
        'Request pricing from Azure and/or GCP for 2–3 representative workloads',
        'If using a consultant or FinOps advisor, engage them now',
        'Research AWS fiscal quarter timing — target negotiation close at quarter-end',
        'Identify your internal champion (CFO, CTO, or Procurement lead) and align on goals',
        'Prepare a one-page "AWS Strategic Partnership Brief" summarizing your growth and commitment',
      ],
    },
    {
      phase: 'P3',
      when: isUrgent ? 'Week 2–3' : 'Months 2–4 Before Renewal',
      title: 'Initial AWS Outreach & Anchoring',
      desc: 'First contact sets the tone. You\'re framing this as a strategic partnership discussion, not a renewal.',
      tasks: [
        'Contact your AWS account manager — request a "strategic review" meeting (not a renewal call)',
        'In the first meeting, lead with your growth roadmap, NOT your current spend',
        s.multicloud !== 'aws-only' ? 'Mention your multi-cloud footprint and the workloads you\'re evaluating consolidating' : 'Reference competitor pricing you\'ve received',
        'Ask AWS to model 3 scenarios: 1yr vs 2yr vs 3yr with marketplace inclusion',
        'Request their first proposal in writing — do not verbally commit to anything',
      ],
    },
    {
      phase: 'P4',
      when: isUrgent ? 'Week 3–4' : '4–6 Weeks Before Renewal',
      title: 'Negotiation & Counter-Proposal',
      desc: 'This is where the real negotiation happens. Go beyond headline discount to all 8 contract terms.',
      tasks: [
        'Counter AWS\'s first offer — anchor 15–20% higher than their opening discount',
        'Negotiate each of the 8 contract terms: discount, marketplace inclusion, Savings Plan stacking, carry-forward, support rate, renewal mechanics, shortfall treatment, exclusions',
        'Use competitive quotes as leverage — "Azure has offered us X for this workload"',
        'Request funded professional services, training credits, and MAP credits as add-ons',
        'Get everything in writing; confirm each change in the redlined agreement',
      ],
    },
    {
      phase: 'P5',
      when: isUrgent ? 'Week 4–5' : '1–2 Weeks Before Close',
      title: 'Final Close & Contract Review',
      desc: 'Don\'t let urgency lead to signing unfavorable terms. Legal and finance review is non-negotiable.',
      tasks: [
        'Have legal counsel review PPA/EDP language — especially shortfall and auto-renewal clauses',
        'Confirm all negotiated terms are reflected in the final agreement (not just in emails)',
        'Validate carry-forward, shortfall, and marketplace inclusion language is explicit',
        'Set up post-signing review cadence: quarterly business reviews with your AWS account team',
        'Establish internal tracking: commit utilization dashboard, quarterly forecasts vs. actuals',
      ],
    },
  ];

  return phases;
}

function buildConcessions(s, tier) {
  const concessions = [];

  concessions.push({
    icon: '💳',
    title: 'Carry-Forward Provisions',
    desc: 'Unused annual commitment rolls to the next year rather than being forfeited.',
    priority: 'must',
  });

  if (tier >= 3) {
    concessions.push({
      icon: '🏪',
      title: 'AWS Marketplace Inclusion',
      desc: 'Up to 25% of commitment can burn down via Marketplace purchases.',
      priority: 'must',
    });
  }

  if (s.supportTier === 'enterprise' || s.supportTier === 'enterprise-on-ramp') {
    concessions.push({
      icon: '🎧',
      title: 'Support Rate Reduction',
      desc: 'Negotiate 10% Enterprise Support down to 7–8%, or cap at a fixed dollar amount.',
      priority: tier >= 4 ? 'must' : 'should',
    });
  }

  if (s.migrationPlans.includes('migrating-to-aws') || s.migrationPlans.includes('onprem-exit')) {
    concessions.push({
      icon: '✈️',
      title: 'MAP Migration Credits',
      desc: 'AWS credits covering 25–50% of migration project costs via the Migration Acceleration Program.',
      priority: 'must',
    });
  }

  concessions.push({
    icon: '📦',
    title: 'Savings Plans Stacking',
    desc: 'Explicit language allowing Compute Savings Plans to apply on top of EDP pricing.',
    priority: 'should',
  });

  concessions.push({
    icon: '🔄',
    title: 'Shortfall Protection',
    desc: 'Unused commitment converts to credits rather than requiring cash payment.',
    priority: 'should',
  });

  if (tier >= 3) {
    concessions.push({
      icon: '👩‍💻',
      title: 'Funded Professional Services',
      desc: '$25K–$100K in AWS ProServ time for architecture reviews, FinOps, or implementation.',
      priority: 'should',
    });
  }

  concessions.push({
    icon: '🎓',
    title: 'Training & Certification Credits',
    desc: 'Credits for AWS training courses and certification exam vouchers for your team.',
    priority: tier >= 3 ? 'should' : 'nice',
  });

  if (s.useCases.includes('ml-ai')) {
    concessions.push({
      icon: '🤖',
      title: 'Bedrock / SageMaker Credits',
      desc: 'Service-specific AI credits to accelerate ML workload development.',
      priority: 'should',
    });
  }

  concessions.push({
    icon: '📋',
    title: 'Dedicated TAM Allocation',
    desc: 'Named Technical Account Manager with defined SLA response times.',
    priority: tier >= 4 ? 'should' : 'nice',
  });

  concessions.push({
    icon: '🔒',
    title: 'Flexible Renewal Terms',
    desc: 'Right to renegotiate discount at renewal without penalty; no auto-renewal lock-in.',
    priority: 'should',
  });

  if (s.compliance.includes('hipaa') || s.compliance.includes('pci') || s.compliance.includes('fedramp')) {
    concessions.push({
      icon: '🛡️',
      title: 'Compliance Acceleration Support',
      desc: 'Funded compliance advisory hours and access to AWS compliance specialists.',
      priority: 'should',
    });
  }

  return concessions;
}

function buildRisks(s, tier) {
  const risks = [];

  if (s.commitUtilization === 'under70') {
    risks.push({
      level: 'high',
      title: 'Underutilization History',
      desc: 'Prior shortfall weakens your position. AWS may require lower discount tiers or strict shortfall payment terms. Consider a smaller, credible commitment.',
    });
  }

  if (s.renewalTimeline === 'within-1mo') {
    risks.push({
      level: 'high',
      title: 'Negotiating Under Deadline',
      desc: 'Urgency is your opponent\'s advantage. AWS knows you can\'t walk away easily. Request an extension before signing anything.',
    });
  }

  if (s.multicloud === 'aws-only') {
    risks.push({
      level: 'high',
      title: 'No Competitive Alternative',
      desc: 'All-in on AWS with no credible alternative significantly limits your leverage. AWS knows switching costs are high. Get at least one competitive quote before negotiating.',
    });
  }

  if (s.optimizationStatus === 'unoptimized') {
    risks.push({
      level: 'medium',
      title: 'Inflated Commit Baseline',
      desc: 'Committing to unoptimized spend means paying for waste at a committed rate. Optimize first, then commit.',
    });
  }

  if (s.spendGrowth === 'declining') {
    risks.push({
      level: 'medium',
      title: 'Declining Spend Trajectory',
      desc: 'Declining AWS spend reduces your leverage significantly. AWS prioritizes growing accounts. Be transparent, focus on future workloads, and commit conservatively.',
    });
  }

  if (tier <= 1) {
    risks.push({
      level: 'medium',
      title: 'Below EDP Threshold',
      desc: 'Your current spend may fall below the standard $1M EDP minimum. Focus on Savings Plans + Reserved Instances for now. Build a compelling growth story to access EDP.',
    });
  }

  risks.push({
    level: 'medium',
    title: 'Auto-Renewal Clauses',
    desc: 'Many PPAs auto-renew at the same or worse terms without formal notice. Negotiate explicit renewal negotiation windows (90 days notice required) into the agreement.',
  });

  if (s.desiredTerm === '3yr') {
    risks.push({
      level: 'medium',
      title: '3-Year Lock-in Risk',
      desc: 'A 3-year commitment at current pricing can backfire if services are repriced or if your architecture changes significantly. Negotiate annual true-up provisions.',
    });
  }

  risks.push({
    level: 'low',
    title: 'Account Team Turnover',
    desc: 'AWS account teams turn over frequently. Ensure all agreements are contractually documented — don\'t rely on verbal commitments from your current AE.',
  });

  if (s.compliance.includes('hipaa') || s.compliance.includes('fedramp')) {
    risks.push({
      level: 'low',
      title: 'Compliance-Specific Contract Language',
      desc: 'Regulatory commitments (HIPAA, FedRAMP) should be explicitly included in BAAs and addenda — ensure these are part of the EDP package, not separate upsells.',
    });
  }

  return risks;
}

function buildQuestions(s, tier) {
  const questions = [
    'What is the current standard EDP discount for our spend tier, and what would get us to the next tier?',
    'Can you show us a scenario where our existing Compute Savings Plans stack on top of EDP pricing?',
    'What percentage of our EDP commitment can be satisfied through AWS Marketplace purchases?',
  ];

  if (tier >= 3) {
    questions.push('What is the process for negotiating our Enterprise Support rate, and what floor can you offer?');
    questions.push('What funded professional services or MAP credits can be included in this agreement?');
  }

  if (s.migrationPlans.includes('migrating-to-aws')) {
    questions.push('We\'re planning to migrate X workloads in the next 12 months — how do we qualify for MAP funding, and is it additive to EDP?');
  }

  questions.push('What are the exact shortfall mechanics — if we miss our annual commitment, how is the shortfall calculated and billed?');
  questions.push('How does the carry-forward work — if we underspend in Year 1 of a 3-year EDP, how is the unused amount applied?');

  if (s.multicloud !== 'aws-only') {
    questions.push('We currently run workloads on Azure/GCP — what discount improvement would you offer if we committed to consolidating those on AWS?');
  }

  questions.push('What happens to our discount rate if our spend grows 50% above the committed level — is there an upside ramp?');
  questions.push('Can you show us the full redlined PPA template before we agree to terms verbally?');

  if (s.useCases.includes('ml-ai')) {
    questions.push('What service-specific credits or discounts exist for Bedrock and SageMaker as part of an EDP?');
  }

  if (tier >= 5) {
    questions.push('What executive sponsorship from AWS leadership is included at our investment level?');
  }

  return questions.slice(0, 10);
}

function buildAlerts(s, tier) {
  const alerts = [];

  if (s.renewalTimeline === 'within-1mo') {
    alerts.push({
      type: 'danger',
      icon: '🚨',
      text: '<strong>Urgent: You have less than 30 days.</strong> Do not sign anything under deadline pressure. Immediately request a 60–90 day extension of current terms while negotiating. This is your most important first step.',
    });
  }

  if (s.commitUtilization === 'under70' && tier >= 2) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      text: '<strong>Shortfall Risk Detected.</strong> You underutilized your prior commitment by 30%+. AWS will use this against you in negotiations. Proactively acknowledge this, explain why (optional: infrastructure optimization), and commit to a more conservative, achievable number this cycle.',
    });
  }

  if (s.multicloud === 'aws-only' && tier >= 3) {
    alerts.push({
      type: 'warning',
      icon: '⚡',
      text: '<strong>No Competitive Leverage Detected.</strong> At your spend level, going into an EDP negotiation without a credible competitive alternative significantly reduces your potential discount by 5–10 points. Even requesting Azure/GCP pricing for a small workload before negotiating is worth doing.',
    });
  }

  if (tier <= 1 && s.annualSpend !== 'under100k') {
    alerts.push({
      type: 'info',
      icon: 'ℹ️',
      text: '<strong>EDP Threshold:</strong> Standard EDP eligibility starts at $1M annual spend. At your current level, focus on Compute Savings Plans and Reserved Instances. However, if you have strong growth projections, AWS may offer an EDP based on committed future spend — especially if you\'re entering a high-growth phase.',
    });
  }
  if (s.edpMonthsRemaining === 'under3') {
    alerts.push({ type: 'danger', icon: '🚨', text: '<strong>EDP Expiring in Under 3 Months.</strong> You are in the weakest possible negotiating position — AWS knows you must renew. Immediately request a short-term 90-day extension at current rates while negotiating the new EDP. Do not let the contract lapse; AWS will reset pricing to on-demand rates.' });
  } else if (s.edpMonthsRemaining === '3-6') {
    alerts.push({ type: 'warning', icon: '⚠️', text: '<strong>Limited EDP Negotiation Window.</strong> With 3–6 months remaining, your leverage window is narrowing. Begin formal EDP discussions now. AWS\'s first offer at this stage tends to be below what is achievable with a 9-month runway — push back on the first proposal.' });
  }
  if (s.databaseSavingsPlans && s.databaseSavingsPlans !== 'none') {
    alerts.push({ type: 'success', icon: '🟢', text: '<strong>Database Savings Plans Opportunity Detected.</strong> AWS launched Database Savings Plans in December 2025 — 12–35% discounts on Aurora Serverless, DocumentDB, Neptune, Keyspaces, and Timestream on 1-year no-upfront terms. These are almost never included in AWS\'s EDP proposal. Raise this as a separate workstream in your negotiation and request they be included in your EDP credit package.' });
  }

  if (s.contractType === 'on-demand' && tier >= 2) {
    alerts.push({
      type: 'warning',
      icon: '💸',
      text: '<strong>Significant Savings Opportunity Missed.</strong> You\'re currently on On-Demand pricing at a spend level where structured discounts (Savings Plans or EDP) would deliver 10–30% savings. This is a high-priority negotiation.',
    });
  }

  if (s.optimizationStatus === 'unoptimized' && tier >= 2) {
    alerts.push({
      type: 'info',
      icon: '🔧',
      text: '<strong>Optimize Before You Commit.</strong> AWS Compute Optimizer typically identifies 20–35% cost reduction in unoptimized environments. Completing this before your EDP negotiation lowers your commit baseline and reduces the risk of over-committing to inflated spend.',
    });
  }

  return alerts;
}

function buildCommitStructureHTML(s, tier) {
  if (tier < 2) {
    return `
    <div class="strategy-section">
      <div class="section-header">
        <span class="section-icon">🏗️</span>
        <h3>Recommended Commitment Structure</h3>
      </div>
      <div class="section-content">
        <div class="alert alert-info"><span class="alert-icon">ℹ️</span>
          <div>At your current spend level, the most cost-effective approach is <strong>Compute Savings Plans</strong> (1-year or 3-year, no upfront or partial upfront). These deliver 20–66% off On-Demand rates with no minimum commitment requirement and apply automatically across EC2, Fargate, and Lambda. Once your spend exceeds $500K–$1M, initiate EDP conversations with your AWS account team proactively.</div>
        </div>
      </div>
    </div>`;
  }

  const termAdvice = s.desiredTerm === '3yr'
    ? '3-year EDP — offers deepest discount but highest commitment risk. Negotiate annual ramp and carry-forward.'
    : s.desiredTerm === '2yr'
    ? '2-year EDP — good balance of discount depth and flexibility. Most commonly signed at $2M–$5M spend.'
    : '1-year EDP (first cycle) — prove the relationship, then extend to 3 years at renewal with better terms.';

  return `
  <div class="strategy-section">
    <div class="section-header">
      <span class="section-icon">🏗️</span>
      <h3>Recommended Commitment Structure</h3>
    </div>
    <div class="section-content" style="display:flex;flex-direction:column;gap:14px;">
      <div class="alert alert-success"><span class="alert-icon">✅</span>
        <div><strong>Recommended:</strong> ${termAdvice}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:.85rem;">
        <thead>
          <tr style="border-bottom:2px solid var(--border);">
            <th style="text-align:left;padding:8px;color:var(--text-secondary);">Structure</th>
            <th style="text-align:center;padding:8px;color:var(--text-secondary);">Discount</th>
            <th style="text-align:center;padding:8px;color:var(--text-secondary);">Flexibility</th>
            <th style="text-align:left;padding:8px;color:var(--text-secondary);">Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--surface-3);">
            <td style="padding:9px 8px;font-weight:600;">1-Year EDP</td>
            <td style="padding:9px 8px;text-align:center;">★★★☆☆</td>
            <td style="padding:9px 8px;text-align:center;">★★★★☆</td>
            <td style="padding:9px 8px;color:var(--text-secondary);">First EDP, uncertain growth</td>
          </tr>
          <tr style="border-bottom:1px solid var(--surface-3);">
            <td style="padding:9px 8px;font-weight:600;">3-Year EDP</td>
            <td style="padding:9px 8px;text-align:center;">★★★★★</td>
            <td style="padding:9px 8px;text-align:center;">★★☆☆☆</td>
            <td style="padding:9px 8px;color:var(--text-secondary);">Stable workloads, predictable growth</td>
          </tr>
          <tr style="border-bottom:1px solid var(--surface-3);">
            <td style="padding:9px 8px;font-weight:600;">EDP + Savings Plans Stack</td>
            <td style="padding:9px 8px;text-align:center;">★★★★★</td>
            <td style="padding:9px 8px;text-align:center;">★★★☆☆</td>
            <td style="padding:9px 8px;color:var(--text-secondary);">Heavy compute, EC2-dominant spend</td>
          </tr>
          <tr>
            <td style="padding:9px 8px;font-weight:600;">Savings Plans Only</td>
            <td style="padding:9px 8px;text-align:center;">★★★☆☆</td>
            <td style="padding:9px 8px;text-align:center;">★★★★★</td>
            <td style="padding:9px 8px;color:var(--text-secondary);">Sub-$1M, high variability</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

// ─── Export / Print ───────────────────────────────────────────────────────────
function printStrategy() {
  window.print();
}
