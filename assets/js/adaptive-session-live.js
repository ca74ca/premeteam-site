const whoopUserIdInput = document.getElementById('whoopUserIdInput');
const showWhoopRawToggle = document.getElementById('showWhoopRawToggle');
const refreshBtn = document.getElementById('refreshBtn');
const reconnectBtn = document.getElementById('reconnectBtn');
const coachAgentBtn = document.getElementById('coachAgentBtn');
const WHOOP_AUTH_URL = 'https://www.varacis.com/api/whoop-auth';

const statusText = document.getElementById('statusText');
const liveWhoopPill = document.getElementById('liveWhoopPill');
const liveWhoopLabel = document.getElementById('liveWhoopLabel');
const heroAthleteName = document.getElementById('heroAthleteName');
const outlookLabel = document.getElementById('outlookLabel');
const biometricsHeading = document.getElementById('biometricsHeading');

const readinessChip = document.getElementById('readinessChip');
const sourceChip = document.getElementById('sourceChip');
const sessionTitle = document.getElementById('sessionTitle');
const sessionIntensity = document.getElementById('sessionIntensity');
const sessionFocus = document.getElementById('sessionFocus');
const sessionFinisher = document.getElementById('sessionFinisher');
const sessionBlocks = document.getElementById('sessionBlocks');
const coachPromptInput = document.getElementById('coachPromptInput');
const sportInput = document.getElementById('sportInput');
const bookingDateInput = document.getElementById('bookingDateInput');
const bookingDurationInput = document.getElementById('bookingDurationInput');
const workflowMeta = document.getElementById('workflowMeta');
const whoopRecovery = document.getElementById('whoopRecovery');
const whoopSleep = document.getElementById('whoopSleep');
const whoopStrain = document.getElementById('whoopStrain');
const whoopRhr = document.getElementById('whoopRhr');
const whoopHrv = document.getElementById('whoopHrv');
const readinessScoreValue = document.getElementById('readinessScoreValue');
const zoneClassifierChip = document.getElementById('zoneClassifierChip');
const loadTierChip = document.getElementById('loadTierChip');
const sportNameValue = document.getElementById('sportNameValue');
const zoneBreakdownValue = document.getElementById('zoneBreakdownValue');
const heartRateValue = document.getElementById('heartRateValue');
const deltaZoneMinutesValue = document.getElementById('deltaZoneMinutesValue');
const deltaZoneRatioValue = document.getElementById('deltaZoneRatioValue');
const loadPenaltyValue = document.getElementById('loadPenaltyValue');
const scoringBreakdownValue = document.getElementById('scoringBreakdownValue');
const zoneDistributionTotal = document.getElementById('zoneDistributionTotal');
const zoneBarZ0 = document.getElementById('zoneBarZ0');
const zoneBarZ1 = document.getElementById('zoneBarZ1');
const zoneBarZ2 = document.getElementById('zoneBarZ2');
const zoneBarZ3 = document.getElementById('zoneBarZ3');
const zoneBarZ4 = document.getElementById('zoneBarZ4');
const zoneBarZ5 = document.getElementById('zoneBarZ5');
const zoneValueZ0 = document.getElementById('zoneValueZ0');
const zoneValueZ1 = document.getElementById('zoneValueZ1');
const zoneValueZ2 = document.getElementById('zoneValueZ2');
const zoneValueZ3 = document.getElementById('zoneValueZ3');
const zoneValueZ4 = document.getElementById('zoneValueZ4');
const zoneValueZ5 = document.getElementById('zoneValueZ5');
const deltaScoreValue = document.getElementById('deltaScoreValue');
const deltaScoreMeta = document.getElementById('deltaScoreMeta');
const deltaScoreBar = document.getElementById('deltaScoreBar');
const coachFormulaIntro = document.getElementById('coachFormulaIntro');
const coachFormulaList = document.getElementById('coachFormulaList');
const coachFormulaUse = document.getElementById('coachFormulaUse');
const coachZoneZ1Stat = document.getElementById('coachZoneZ1Stat');
const coachZoneZ2Stat = document.getElementById('coachZoneZ2Stat');
const coachZoneZ3Stat = document.getElementById('coachZoneZ3Stat');
const coachZoneZ4Stat = document.getElementById('coachZoneZ4Stat');
const coachZoneZ5Stat = document.getElementById('coachZoneZ5Stat');

const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const whoopRawPanel = document.getElementById('whoopRawPanel');
const whoopRawPre = document.getElementById('whoopRawPre');
const telemetryOverlay = document.getElementById('telemetryOverlay');
const telemetryOverlayTitle = document.getElementById('telemetryOverlayTitle');
const telemetryOverlayMessage = document.getElementById('telemetryOverlayMessage');
const telemetryOverlayMeta = document.getElementById('telemetryOverlayMeta');
const telemetryOverlayClose = document.getElementById('telemetryOverlayClose');

const STORAGE_KEY = 'adaptiveSessionLiveUserId';
const DEFAULT_WHOOP_USER_ID = String(window.DELTA_WHOOP_USER_ID || '1243444');

// ─── Delta Zone Voice Layer ───────────────────────────────────────────────────
const BLACKLIST_MAP = [
  { pattern: /\bcore work\b/gi, replacement: 'Structural Integrity' },
  { pattern: /\blight\b/gi, replacement: 'Structural Integrity' },
  { pattern: /\beasy\b/gi, replacement: 'Active Flush' },
  { pattern: /\brest\b/gi, replacement: 'Active Flush Window' },
  { pattern: /\brpe\b/gi, replacement: 'Zone Authority' }
];
const FINAL_STATEMENT_SUFFIX = 'The final round is your best round.';
const TELEMETRY_POLL_MS = 12000;
const TELEMETRY_ALERT_COOLDOWN_MS = 15000;

let latestTelemetryOverrides = {};
let latestTargetZone = null;
let telemetryOverlayTimer = null;
let telemetryPollTimer = null;
let lastTelemetryAlert = { scenario: '', at: 0 };

function sanitizeBlockText(text) {
  if (!text) return text;
  let result = String(text);
  for (const { pattern, replacement } of BLACKLIST_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function mapIntensityToStatus(intensity) {
  const raw = String(intensity || '').trim();
  const num = parseFloat(raw);
  if (Number.isFinite(num)) {
    if (num <= 4) return '<span class="status-precision">Precision Recovery</span>';
    if (num >= 8) return '<span class="status-redline">Redline Authority</span>';
    return raw;
  }
  const lower = raw.toLowerCase();
  if (lower === 'low' || lower.includes('low')) return '<span class="status-precision">Precision Recovery</span>';
  if (lower === 'high' || lower.includes('high')) return '<span class="status-redline">Redline Authority</span>';
  if (lower === '-' || lower === '') return '-';
  return raw;
}

function renderBlockItem(text) {
  const sanitized = sanitizeBlockText(text);
  const lower = (sanitized || '').toLowerCase();
  if (lower.includes('active flush')) {
    return `<li><div class="active-flush-timer">${sanitized}</div></li>`;
  }
  return `<li class="block-item">${sanitized}</li>`;
}

function formatFinalStatement(value) {
  const base = sanitizeBlockText(value || '');
  if (!base) return '-';
  const normalizedBase = base.trim();
  if (!normalizedBase) return '-';
  const hasSuffix = normalizedBase.toLowerCase().includes(FINAL_STATEMENT_SUFFIX.toLowerCase());
  return hasSuffix ? normalizedBase : `${normalizedBase} ${FINAL_STATEMENT_SUFFIX}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeInstructions(block) {
  if (Array.isArray(block?.instructions)) {
    return block.instructions.filter(Boolean).map((item) => sanitizeBlockText(item));
  }
  if (Array.isArray(block?.exercises)) {
    return block.exercises.map((exercise) => {
      const sets = exercise?.sets || exercise?.rounds || '';
      const reps = exercise?.reps || exercise?.duration || '';
      const effort = exercise?.effort || '';
      const parts = [exercise?.name || 'Exercise'];
      if (sets) parts.push(String(sets));
      if (reps) parts.push(String(reps));
      if (effort) parts.push(String(effort));
      return sanitizeBlockText(parts.join(' · '));
    });
  }
  return [];
}

function validateLogicBlock(block) {
  const missing = [];
  if (!block.target_zone) missing.push('target_zone');
  if (!block.rounds) missing.push('rounds');
  if (!block.instructions?.length) missing.push('instructions');
  if (missing.length) {
    throw new Error(`Block validation failed: missing ${missing.join(', ')}`);
  }
}

function normalizeLogicBlock(rawBlock, fallbackTitle = 'Block') {
  const block = {
    title: sanitizeBlockText(rawBlock?.title || rawBlock?.block || fallbackTitle),
    target_zone: sanitizeBlockText(rawBlock?.target_zone || rawBlock?.targetZone || rawBlock?.zone || ''),
    rounds: sanitizeBlockText(rawBlock?.rounds || rawBlock?.sets || ''),
    instructions: normalizeInstructions(rawBlock),
    transition: sanitizeBlockText(rawBlock?.transition || ''),
    active_flush: sanitizeBlockText(rawBlock?.active_flush || rawBlock?.activeFlush || '')
  };
  validateLogicBlock(block);
  return block;
}

function buildAdaptiveLogicBlocks(session) {
  if (Array.isArray(session?.logic_blocks)) {
    return session.logic_blocks
      .map((item, index) => {
        try {
          return normalizeLogicBlock(item, `Block ${index + 1}`);
        } catch (error) {
          console.error(error.message, item);
          return null;
        }
      })
      .filter(Boolean);
  }

  const keyedBlocks = Object.entries(session || {})
    .filter(([key, value]) => key.startsWith('block_') && value && typeof value === 'object')
    .map(([, value], index) => {
      try {
        return normalizeLogicBlock(value, `Block ${index + 1}`);
      } catch (error) {
        console.error(error.message, value);
        return null;
      }
    })
    .filter(Boolean);

  return keyedBlocks;
}

function buildCoachLogicBlocks(result, sessionOutput, mainWorkout) {
  const normalizeMainWorkoutCandidates = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.filter((item) => item && typeof item === 'object');
    }

    if (typeof value === 'object') {
      const keyed = Object.entries(value)
        .filter(([key, item]) => {
          if (!item || typeof item !== 'object') return false;
          return /^block[_\s-]/i.test(key) || /^block\s*[a-z0-9]+$/i.test(key);
        })
        .map(([, item]) => item);

      if (keyed.length) return keyed;

      if (value.block_a || value.block_b || value.block_c) {
        return [value.block_a, value.block_b, value.block_c].filter((item) => item && typeof item === 'object');
      }
    }

    return [];
  };

  const candidates = [
    result?.logic_blocks,
    result?.programming_logic?.logic_blocks,
    sessionOutput?.logic_blocks,
    sessionOutput?.main_workout,
    sessionOutput?.main_workout_blocks,
    result?.main_workout,
    result?.main_workout_blocks
  ];

  const explicit = candidates
    .flatMap((item) => normalizeMainWorkoutCandidates(item))
    .filter(Boolean);

  if (explicit.length) {
    return explicit
      .map((item, index) => {
        try {
          return normalizeLogicBlock(item, `Block ${index + 1}`);
        } catch (error) {
          console.error(error.message, item);
          return null;
        }
      })
      .filter(Boolean);
  }

  return mainWorkout
    .map((item, index) => {
      try {
        return normalizeLogicBlock(item, item?.block || `Block ${index + 1}`);
      } catch (error) {
        console.error(error.message, item);
        return null;
      }
    })
    .filter(Boolean);
}

function renderStructuredWorkoutCards(blocks) {
  return blocks.map((block) => {
    const title = escapeHtml(block.title || 'Block');
    const targetZone = escapeHtml(block.target_zone || 'Zone Authority');
    const rounds = escapeHtml(block.rounds || '');
    const instructions = block.instructions
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');

    const commandRows = [
      block.transition ? `<p class="command-box-item"><strong>Transition</strong> ${escapeHtml(block.transition)}</p>` : '',
      block.active_flush ? `<p class="command-box-item"><strong>Active Flush</strong> ${escapeHtml(block.active_flush)}</p>` : ''
    ].filter(Boolean).join('');

    return `
      <li class="workout-card">
        <div class="workout-card-head">
          <p class="workout-card-title">${title}</p>
          <span class="instruction-badge">${targetZone}</span>
        </div>
        <p class="workout-card-rounds">${rounds}</p>
        <ul class="workout-card-list">${instructions}</ul>
        ${commandRows ? `<div class="command-box">${commandRows}</div>` : ''}
      </li>
    `;
  }).join('');
}

function parseZoneNumber(value) {
  if (value === undefined || value === null) return null;
  const match = String(value).match(/(?:zone\s*)?(\d)/i);
  if (!match) return null;
  const zone = Number(match[1]);
  return Number.isFinite(zone) ? zone : null;
}

function pickFirstZone(source, paths) {
  for (const path of paths) {
    const value = getNumberAtPath(source, path);
    const zone = parseZoneNumber(value);
    if (zone !== null) return zone;
  }
  return null;
}

function extractCurrentZone(whoopPayload, adaptivePayload) {
  const zoneFromWhoop = pickFirstZone(whoopPayload || {}, [
    'current_zone',
    'live.current_zone',
    'telemetry.current_zone',
    'workout.current_zone',
    'workout.score.current_zone',
    'workout.live.current_zone'
  ]);
  if (zoneFromWhoop !== null) return zoneFromWhoop;

  return pickFirstZone(adaptivePayload || {}, [
    'workout_context.current_zone',
    'session.current_zone',
    'telemetry.current_zone'
  ]);
}

function extractTargetZoneFromSession(session) {
  const direct = parseZoneNumber(session?.target_zone || session?.current_target_zone || session?.zone_target);
  if (direct !== null) return direct;

  const logicBlocks = buildAdaptiveLogicBlocks(session || {});
  if (logicBlocks.length) {
    const fromBlock = parseZoneNumber(logicBlocks[0]?.target_zone);
    if (fromBlock !== null) return fromBlock;
  }

  const candidates = [session?.block_a, session?.block_b, session?.block_c];
  for (const candidate of candidates) {
    const zone = parseZoneNumber(candidate?.target_zone);
    if (zone !== null) return zone;
  }

  return null;
}

function buildTelemetryOverrideMap(overrides) {
  const map = {};
  const rows = Array.isArray(overrides) ? overrides : [];
  rows.forEach((entry) => {
    const scenario = String(entry?.scenario || '').toUpperCase();
    if (!scenario) return;
    map[scenario] = {
      command: sanitizeBlockText(entry?.command || ''),
      trigger: sanitizeBlockText(entry?.trigger || '')
    };
  });
  return map;
}

function inferTargetFromTrigger(triggerText) {
  return parseZoneNumber(triggerText || '');
}

function showTelemetryOverlay(scenario, commandText, currentZone, targetZone) {
  if (!telemetryOverlay) return;

  const toneClass = scenario === 'UNDER_PERFORMING' ? 'under' : 'over';
  telemetryOverlay.classList.remove('under', 'over');
  telemetryOverlay.classList.add(toneClass, 'show');

  if (telemetryOverlayTitle) {
    telemetryOverlayTitle.textContent = scenario === 'UNDER_PERFORMING'
      ? 'UNDER PERFORMING COMMAND'
      : 'OVER PERFORMING COMMAND';
  }
  if (telemetryOverlayMessage) {
    telemetryOverlayMessage.textContent = commandText || 'Command unavailable for this telemetry event.';
  }
  if (telemetryOverlayMeta) {
    telemetryOverlayMeta.textContent = `Current zone Z${currentZone ?? '-'} | Target zone Z${targetZone ?? '-'}`;
  }

  if (telemetryOverlayTimer) {
    window.clearTimeout(telemetryOverlayTimer);
  }
  telemetryOverlayTimer = window.setTimeout(() => {
    telemetryOverlay?.classList.remove('show');
  }, 7200);
}

function evaluateTelemetryOverrides(adaptivePayload, whoopPayload) {
  const currentZone = extractCurrentZone(whoopPayload, adaptivePayload);
  if (currentZone === null) return;

  const session = adaptivePayload?.session || {};
  const fallbackTarget = extractTargetZoneFromSession(session);
  const underTarget = inferTargetFromTrigger(latestTelemetryOverrides.UNDER_PERFORMING?.trigger);
  const overTarget = inferTargetFromTrigger(latestTelemetryOverrides.OVER_PERFORMING?.trigger);
  const targetZone = latestTargetZone || underTarget || overTarget || fallbackTarget;
  if (targetZone === null) return;

  let scenario = '';
  if (currentZone < targetZone) {
    scenario = 'UNDER_PERFORMING';
  } else if (currentZone > targetZone) {
    scenario = 'OVER_PERFORMING';
  }
  if (!scenario) return;

  const now = Date.now();
  if (lastTelemetryAlert.scenario === scenario && (now - lastTelemetryAlert.at) < TELEMETRY_ALERT_COOLDOWN_MS) {
    return;
  }

  const fallbackMessage = scenario === 'UNDER_PERFORMING'
    ? `Status check: telemetry is below target. Move to Zone ${targetZone} now.`
    : `Telemetry is above target too early. Calibrate back to Zone ${targetZone}.`;
  const command = latestTelemetryOverrides[scenario]?.command || fallbackMessage;
  showTelemetryOverlay(scenario, command, currentZone, targetZone);

  lastTelemetryAlert = { scenario, at: now };
}

function scheduleTelemetryPolling() {
  if (telemetryPollTimer) {
    window.clearInterval(telemetryPollTimer);
  }

  telemetryPollTimer = window.setInterval(async () => {
    const whoopUserId = getCurrentWhoopUserId();
    const adaptiveUrl = makeUrl('/api/get-adaptive-session', { whoopUserId });
    const whoopUrl = makeUrl('/api/whoop-data', { whoopUserId });

    try {
      const [adaptiveResult, whoopResult] = await Promise.allSettled([
        fetchJson(adaptiveUrl),
        fetchJson(whoopUrl)
      ]);
      if (adaptiveResult.status !== 'fulfilled') return;

      const adaptivePayload = adaptiveResult.value;
      const whoopPayload = whoopResult.status === 'fulfilled' ? whoopResult.value : null;

      latestTelemetryOverrides = buildTelemetryOverrideMap(adaptivePayload?.session?.telemetry_overrides || []);
      latestTargetZone = extractTargetZoneFromSession(adaptivePayload?.session || {});
      evaluateTelemetryOverrides(adaptivePayload, whoopPayload);
    } catch (error) {
      console.warn('telemetry polling failed', error);
    }
  }, TELEMETRY_POLL_MS);
}

const UI_COPY = {
  outlookLabel: 'TODAYS OUTLOOK',
  biometricsHeading: 'LIVE POHE BIOMETRICS SNAPSHOT'
};

function resolveApiBase() {
  const explicitRoot = window.DELTA_AGENT_API_ROOT || '';
  if (explicitRoot && /^https?:\/\//i.test(explicitRoot)) {
    return explicitRoot.replace(/\/$/, '');
  }

  const { protocol, hostname } = window.location;
  if (hostname.includes('deltazonesystem.com')) {
    return 'https://www.varacis.com';
  }
  if (hostname.includes('.app.github.dev')) {
    const backendHost = hostname.replace(/-\d+\.app\.github\.dev$/, '-3000.app.github.dev');
    return `${protocol}//${backendHost}`;
  }

  return '';
}

function makeUrl(path, params = {}) {
  const base = resolveApiBase();
  const url = new URL(`${base}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function setStatus(kind, label, message) {
  if (!statusText) return;
  if (liveWhoopPill) {
    liveWhoopPill.classList.remove('ok', 'warn', 'bad');
    liveWhoopPill.classList.add(kind);
  }
  if (liveWhoopLabel) {
    liveWhoopLabel.textContent = label;
  }
  statusText.textContent = message;
}

function setAthleteName(value) {
  if (!heroAthleteName) return;
  heroAthleteName.textContent = value || 'Athlete';
}

function applyUiCopy() {
  if (outlookLabel) {
    outlookLabel.textContent = UI_COPY.outlookLabel;
  }
  if (biometricsHeading) {
    biometricsHeading.textContent = UI_COPY.biometricsHeading;
  }
}

function getCurrentWhoopUserId() {
  const typedValue = whoopUserIdInput?.value?.trim();
  return typedValue || DEFAULT_WHOOP_USER_ID;
}

function resolveAthleteName(whoopPayload, adaptivePayload, historyPayload, whoopUserId) {
  const historyFirst = Array.isArray(historyPayload) ? historyPayload[0] : null;
  const candidates = [
    adaptivePayload?.athlete_name,
    adaptivePayload?.member_name,
    adaptivePayload?.name,
    adaptivePayload?.profile?.name,
    adaptivePayload?.session?.athlete_name,
    whoopPayload?.athlete_name,
    whoopPayload?.member_name,
    whoopPayload?.name,
    whoopPayload?.profile?.name,
    whoopPayload?.user?.display_name,
    whoopPayload?.user?.name,
    historyFirst?.athlete_name,
    historyFirst?.member_name,
    historyFirst?.name,
    historyFirst?.profile?.name
  ].map((value) => String(value || '').trim()).filter(Boolean);

  if (candidates[0]) return candidates[0];
  return `Athlete ${whoopUserId}`;
}

function setReadiness(readiness, recoveryPct) {
  if (!readinessChip) return;
  const value = String(readiness || 'UNKNOWN').toUpperCase();
  const cls = value === 'HIGH' ? 'high' : value === 'MODERATE' ? 'moderate' : value === 'LOW' ? 'low' : 'unknown';
  readinessChip.className = `readiness-chip ${cls}`;
  const labelMap = {
    HIGH: 'STATUS: REDLINE AUTHORITY',
    MODERATE: 'STATUS: PRECISION CALIBRATION',
    LOW: 'STATUS: PRECISION CALIBRATION',
    UNKNOWN: 'STATUS: AWAITING SIGNAL'
  };
  const label = labelMap[value] || `STATUS: ${value}`;

  const recoveryEl = document.getElementById('readinessRecovery');
  if (recoveryEl) {
    const pct = Number.isFinite(Number(recoveryPct)) ? Math.round(Number(recoveryPct)) : null;
    if (pct !== null) {
      recoveryEl.textContent = `RECOVERY ${pct}%`;
      recoveryEl.hidden = false;
    } else {
      recoveryEl.hidden = true;
    }
  }

  // Set label text without disturbing the recovery child element
  const firstTextNode = Array.from(readinessChip.childNodes)
    .find((n) => n.nodeType === Node.TEXT_NODE);
  if (firstTextNode) {
    firstTextNode.textContent = label;
  } else {
    readinessChip.prepend(document.createTextNode(label));
  }
}

function setSource(source) {
  if (!sourceChip) return;
  if (source === 'coach') {
    sourceChip.className = 'source-chip live';
    sourceChip.textContent = 'AI Coach';
    return;
  }
  const normalized = source === 'whoop' ? 'whoop' : 'fallback';
  sourceChip.className = `source-chip ${normalized === 'whoop' ? 'live' : 'fallback'}`;
  sourceChip.textContent = normalized === 'whoop' ? 'Live WHOOP' : 'Fallback';
}

function sourceFromAdaptivePayload(payload) {
  const title = String(payload?.session?.session_title || '').toLowerCase();
  if (title.includes('fallback')) return 'fallback';

  const readiness = String(payload?.readiness || 'UNKNOWN').toUpperCase();
  const whoop = payload?.whoop || {};
  const hasWhoopSignal = Number(whoop.recovery) > 0 || Number(whoop.sleep) > 0 || Number(whoop.strain) > 0;
  if (hasWhoopSignal && readiness !== 'UNKNOWN') return 'whoop';
  return 'fallback';
}

function getWhoopAuthError(whoopPayload) {
  const statusCandidates = [
    whoopPayload?.recovery?.status,
    whoopPayload?.sleep?.status,
    whoopPayload?.workout?.status
  ];
  const status = statusCandidates.find((value) => Number(value) === 401);
  return Number(status) === 401 ? 'WHOOP auth expired (401)' : '';
}

function getNumberAtPath(source, path) {
  return path.split('.').reduce((value, key) => (value ? value[key] : undefined), source);
}

function readNumber(source, candidates) {
  for (const path of candidates) {
    const value = getNumberAtPath(source, path);
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

function formatNumber(value, digits = 0) {
  if (!Number.isFinite(Number(value))) return '-';
  return Number(value).toFixed(digits);
}

function formatNumberOrZero(value, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : (0).toFixed(digits);
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function renderDynamicCoaching(zones, totalMinutes, deltaMinutes, deltaPercent) {
  const pct = (minutes) => (totalMinutes ? ((minutes / totalMinutes) * 100) : 0);
  const z12Pct = pct(zones.z1 + zones.z2);
  const z3Pct = pct(zones.z3);
  const z4Pct = pct(zones.z4);
  const z5Pct = pct(zones.z5);

  const exposureBand = deltaPercent >= 45
    ? 'high threshold exposure'
    : deltaPercent >= 30
      ? 'balanced threshold exposure'
      : 'low threshold exposure';
  const redlineBand = z5Pct >= 8
    ? 'redline stress is elevated'
    : z5Pct >= 3
      ? 'redline stress is moderate'
      : 'redline stress is controlled';

  if (coachFormulaIntro) {
    coachFormulaIntro.textContent = `Session quality is determined by where time is spent. This session shows ${formatNumberOrZero(totalMinutes, 1)} total zone minutes with ${formatNumberOrZero(deltaMinutes, 1)} minutes in Delta (Z3+Z4).`;
  }

  if (coachFormulaList) {
    coachFormulaList.innerHTML = [
      `Z1-Z2 -> build capacity, support recovery (${formatNumberOrZero(z12Pct, 1)}%)`,
      `Z3 -> accumulate controlled fatigue (${formatNumberOrZero(z3Pct, 1)}%)`,
      `Z4 -> drive performance adaptation (${formatNumberOrZero(z4Pct, 1)}%)`,
      `Z5 -> high stress, use sparingly (${formatNumberOrZero(z5Pct, 1)}%)`
    ].map((line) => `<li>${line}</li>`).join('');
  }

  if (coachFormulaUse) {
    coachFormulaUse.textContent = `Used to assess effort distribution, recovery demand, threshold exposure, and overall training load. Current read: ${exposureBand}; ${redlineBand}.`;
  }

  const setZoneStat = (el, minutes) => {
    if (!el) return;
    el.textContent = `${formatNumberOrZero(minutes, 1)}m (${formatNumberOrZero(pct(minutes), 1)}%)`;
  };

  setZoneStat(coachZoneZ1Stat, zones.z1);
  setZoneStat(coachZoneZ2Stat, zones.z2);
  setZoneStat(coachZoneZ3Stat, zones.z3);
  setZoneStat(coachZoneZ4Stat, zones.z4);
  setZoneStat(coachZoneZ5Stat, zones.z5);
}

function renderZoneVisuals(workoutContext, scoring) {
  const zones = {
    z0: toFiniteNumber(workoutContext.zone0_minutes ?? workoutContext.zone_zero_minutes),
    z1: toFiniteNumber(workoutContext.zone1_minutes ?? workoutContext.zone_one_minutes),
    z2: toFiniteNumber(workoutContext.zone2_minutes ?? workoutContext.zone_two_minutes),
    z3: toFiniteNumber(workoutContext.zone3_minutes ?? workoutContext.zone_three_minutes),
    z4: toFiniteNumber(workoutContext.zone4_minutes ?? workoutContext.zone_four_minutes),
    z5: toFiniteNumber(workoutContext.zone5_minutes ?? workoutContext.zone_five_minutes)
  };

  const totalMinutes = toFiniteNumber(workoutContext.total_zone_minutes)
    || (zones.z0 + zones.z1 + zones.z2 + zones.z3 + zones.z4 + zones.z5);

  const pct = (minutes) => {
    if (!totalMinutes) return 0;
    return Math.max(0, Math.min((minutes / totalMinutes) * 100, 100));
  };

  if (zoneDistributionTotal) {
    zoneDistributionTotal.textContent = `Total ${formatNumberOrZero(totalMinutes, 1)} min`;
  }

  const barMap = {
    z0: zoneBarZ0,
    z1: zoneBarZ1,
    z2: zoneBarZ2,
    z3: zoneBarZ3,
    z4: zoneBarZ4,
    z5: zoneBarZ5
  };

  const valueMap = {
    z0: zoneValueZ0,
    z1: zoneValueZ1,
    z2: zoneValueZ2,
    z3: zoneValueZ3,
    z4: zoneValueZ4,
    z5: zoneValueZ5
  };

  Object.entries(zones).forEach(([key, minutes]) => {
    const percent = pct(minutes);
    if (barMap[key]) {
      barMap[key].style.setProperty('--pct', `${percent.toFixed(1)}%`);
      barMap[key].title = `${minutes.toFixed(1)} min (${percent.toFixed(1)}%)`;
    }
    if (valueMap[key]) {
      valueMap[key].textContent = `${minutes.toFixed(1)}m`;
    }
  });

  const deltaMinutes = toFiniteNumber(workoutContext.delta_zone_minutes ?? scoring.delta_zone_minutes)
    || (zones.z3 + zones.z4);
  const deltaRatio = toFiniteNumber(workoutContext.delta_zone_ratio ?? scoring.delta_zone_ratio)
    || (totalMinutes ? (deltaMinutes / totalMinutes) : 0);
  const deltaPercent = Math.max(0, Math.min(deltaRatio * 100, 100));

  renderDynamicCoaching(zones, totalMinutes, deltaMinutes, deltaPercent);

  if (deltaScoreValue) {
    deltaScoreValue.textContent = `${formatNumberOrZero(deltaMinutes, 1)}m`;
  }
  if (deltaScoreMeta) {
    deltaScoreMeta.textContent = `${formatNumberOrZero(deltaPercent, 1)}% of time`;
  }
  if (deltaScoreBar) {
    deltaScoreBar.style.setProperty('--pct', `${deltaPercent.toFixed(1)}%`);
    deltaScoreBar.title = `${deltaMinutes.toFixed(1)} min (${deltaPercent.toFixed(1)}%)`;
  }
}

function extractWhoopSignals(whoopPayload) {
  return {
    recovery: readNumber(whoopPayload, ['recovery', 'recovery_score', 'recovery.score.recovery_score']),
    sleep: readNumber(whoopPayload, ['sleep', 'sleep_performance', 'sleep_performance_percentage', 'sleep.score.sleep_performance_percentage']),
    strain: readNumber(whoopPayload, ['strain', 'workout.score.strain', 'daily_strain']),
    restingHr: readNumber(whoopPayload, ['resting_hr', 'rhr', 'recovery.score.resting_heart_rate', 'recovery.resting_heart_rate']),
    hrv: readNumber(whoopPayload, ['hrv', 'hrv_ms', 'recovery.score.hrv_rmssd_milli', 'recovery.hrv_rmssd_milli'])
  };
}

function renderAdaptiveSession(payload) {
  const readiness = String(payload?.readiness || 'UNKNOWN').toUpperCase();
  const whoop = payload?.whoop || null;
  const workoutContext = payload?.workout_context || {};
  const scoring = payload?.scoring || {};
  const session = payload?.session || {};

  latestTelemetryOverrides = buildTelemetryOverrideMap(session?.telemetry_overrides || []);
  latestTargetZone = extractTargetZoneFromSession(session);

  setReadiness(readiness, payload?.whoop?.recovery);
  setSource(sourceFromAdaptivePayload(payload));

  if (sessionTitle) sessionTitle.textContent = session.session_title || 'Delta Zone session unavailable';
  if (sessionIntensity) sessionIntensity.innerHTML = mapIntensityToStatus(session.intensity);
  if (sessionFocus) sessionFocus.textContent = sanitizeBlockText(session.focus) || '-';
  const finalStatement = session.final_statement || session.finisher;
  if (sessionFinisher) sessionFinisher.textContent = formatFinalStatement(finalStatement);

  if (sessionBlocks) {
    const logicBlocks = buildAdaptiveLogicBlocks(session);
    const blocks = Array.isArray(session.blocks) ? session.blocks.filter(Boolean) : [];
    if (logicBlocks.length) {
      sessionBlocks.innerHTML = renderStructuredWorkoutCards(logicBlocks);
    } else {
      sessionBlocks.innerHTML = blocks.length
        ? blocks.map((block) => renderBlockItem(block)).join('')
        : '<li class="block-item">Architecture pending — no blocks returned by API.</li>';
    }
  }

  if (readinessScoreValue) {
    readinessScoreValue.textContent = formatNumberOrZero(scoring.readiness_score, 1);
  }
  if (zoneClassifierChip) {
    zoneClassifierChip.textContent = workoutContext.zone_classifier || 'Zone Classifier Unavailable';
  }
  if (loadTierChip) {
    loadTierChip.textContent = workoutContext.load_tier || 'Load Tier Unavailable';
  }
  if (sportNameValue) {
    sportNameValue.textContent = workoutContext.sport_name || '-';
  }
  if (zoneBreakdownValue) {
    zoneBreakdownValue.textContent = [
      `Z0 ${formatNumberOrZero(workoutContext.zone0_minutes ?? workoutContext.zone_zero_minutes, 1)}`,
      `Z1 ${formatNumberOrZero(workoutContext.zone1_minutes ?? workoutContext.zone_one_minutes, 1)}`,
      `Z2 ${formatNumberOrZero(workoutContext.zone2_minutes ?? workoutContext.zone_two_minutes, 1)}`,
      `Z3 ${formatNumberOrZero(workoutContext.zone3_minutes ?? workoutContext.zone_three_minutes, 1)}`,
      `Z4 ${formatNumberOrZero(workoutContext.zone4_minutes ?? workoutContext.zone_four_minutes, 1)}`,
      `Z5 ${formatNumberOrZero(workoutContext.zone5_minutes ?? workoutContext.zone_five_minutes, 1)}`
    ].join(' | ');
  }
  if (heartRateValue) {
    const avg = formatNumber(workoutContext.average_heart_rate, 0);
    const max = formatNumber(workoutContext.max_heart_rate, 0);
    heartRateValue.textContent = avg === '-' && max === '-' ? '-' : `${avg} / ${max}`;
  }
  if (deltaZoneMinutesValue) {
    deltaZoneMinutesValue.textContent = formatNumberOrZero(workoutContext.delta_zone_minutes ?? scoring.delta_zone_minutes, 1);
  }
  if (deltaZoneRatioValue) {
    deltaZoneRatioValue.textContent = formatNumberOrZero(workoutContext.delta_zone_ratio ?? scoring.delta_zone_ratio, 3);
  }
  if (loadPenaltyValue) {
    loadPenaltyValue.textContent = formatNumberOrZero(scoring.load_penalty, 1);
  }
  if (scoringBreakdownValue) {
    scoringBreakdownValue.textContent = `${formatNumberOrZero(scoring.recovery_component, 1)} / ${formatNumberOrZero(scoring.sleep_component, 1)} / ${formatNumberOrZero(scoring.load_component, 1)}`;
  }
  renderZoneVisuals(workoutContext, scoring);
  evaluateTelemetryOverrides(payload, whoop);

  if (whoop && sourceFromAdaptivePayload(payload) === 'whoop') {
    setStatus('ok', 'Live WHOOP connected', 'Session generated from live physiology signal.');
  } else {
    setStatus('warn', 'WHOOP unavailable', 'Fallback session active. Reconnect WHOOP and regenerate.');
  }
}

function setWorkflowMeta(value) {
  if (!workflowMeta) return;
  workflowMeta.textContent = value || 'Workflow ID: not generated';
}

function renderCoachSession(result) {
  const sessionOutput = result?.session_output || {};
  const programmingLogic = result?.programming_logic || {};
  const memberContext = result?.member_context || {};
  const mainWorkout = Array.isArray(sessionOutput.main_workout)
    ? sessionOutput.main_workout
    : (sessionOutput.main_workout && typeof sessionOutput.main_workout === 'object')
      ? Object.values(sessionOutput.main_workout).filter((item) => item && typeof item === 'object')
      : [];
  const logicBlocks = buildCoachLogicBlocks(result, sessionOutput, mainWorkout);
  latestTelemetryOverrides = buildTelemetryOverrideMap(
    sessionOutput?.telemetry_overrides
      || programmingLogic?.telemetry_overrides
      || result?.telemetry_overrides
      || []
  );
  latestTargetZone = parseZoneNumber(logicBlocks[0]?.target_zone) || latestTargetZone;

  setReadiness(memberContext?.readiness_score ? 'MODERATE' : 'UNKNOWN', memberContext?.recovery ?? memberContext?.whoop_recovery);
  setSource('coach');
  if (sessionTitle) {
    sessionTitle.textContent = sessionOutput.session_focus || programmingLogic.session_objective || sessionOutput.coach_summary || 'AI Coach session generated';
  }
  if (sessionIntensity) {
    sessionIntensity.innerHTML = mapIntensityToStatus(sessionOutput.session_intensity || programmingLogic.intensity);
  }
  if (sessionFocus) {
    sessionFocus.textContent = sanitizeBlockText(programmingLogic.training_mode || sessionOutput.session_intent || memberContext.primary_goal) || '-';
  }
  if (sessionFinisher) {
    const rawFinisher = sessionOutput.final_statement || (Array.isArray(sessionOutput.cooldown) && sessionOutput.cooldown.length
      ? sessionOutput.cooldown.flatMap((block) => block?.items || []).join(' | ')
      : (sessionOutput.coach_summary || ''));
    sessionFinisher.textContent = formatFinalStatement(rawFinisher);
  }
  if (sessionBlocks) {
    sessionBlocks.innerHTML = logicBlocks.length
      ? renderStructuredWorkoutCards(logicBlocks)
      : '<li class="block-item">Architecture pending — no blocks returned by AI Coach agent.</li>';
  }
  setWorkflowMeta(result?.workflow_id ? `Workflow ID: ${result.workflow_id}` : 'Workflow ID: not returned');
  setStatus('ok', 'AI Coach generated', 'Custom session built from coach prompt and member context.');
}

function renderWhoopSnapshot(payload) {
  const signals = extractWhoopSignals(payload || {});
  if (whoopRecovery) whoopRecovery.textContent = formatNumber(signals.recovery, 0);
  if (whoopSleep) whoopSleep.textContent = formatNumber(signals.sleep, 0);
  if (whoopStrain) whoopStrain.textContent = formatNumber(signals.strain, 7);
  if (whoopRhr) whoopRhr.textContent = formatNumber(signals.restingHr, 0);
  if (whoopHrv) whoopHrv.textContent = formatNumber(signals.hrv, 5);
}

function renderHistory(items) {
  const rows = Array.isArray(items) ? items : [];
  if (historyList) historyList.innerHTML = '';

  if (!rows.length) {
    if (historyEmpty) {
      historyEmpty.style.display = 'block';
      historyEmpty.textContent = 'No session history returned by API.';
    }
    return;
  }

  if (historyEmpty) {
    historyEmpty.style.display = 'none';
  }

  rows.slice(0, 5).forEach((item) => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const createdAt = item?.createdAt ? new Date(item.createdAt).toLocaleString() : '-';
    const sessionTitleValue = item?.session?.session_title || 'Untitled session';
    const source = item?.source === 'whoop' ? 'whoop' : 'fallback';
    const readiness = String(item?.readiness || 'UNKNOWN').toUpperCase();
    const zoneClassifier = item?.workout_context?.zone_classifier || '-';
    const loadTier = item?.workout_context?.load_tier || '-';
    const readinessScore = formatNumber(item?.scoring?.readiness_score, 1);

    li.innerHTML = `
      <div class="history-top">
        <p class="history-title">${sessionTitleValue}</p>
        <span class="source-chip ${source === 'whoop' ? 'live' : 'fallback'}">${source === 'whoop' ? 'Live WHOOP' : 'Fallback'}</span>
      </div>
      <div class="history-meta">${createdAt}</div>
      <div class="history-meta">Readiness: ${readiness} | Status: ${mapIntensityToStatus(item?.session?.intensity).replace(/<[^>]+>/g, '')}</div>
      <div class="history-meta">Readiness score: ${readinessScore === '-' ? '0.0' : readinessScore} | ${zoneClassifier} | ${loadTier}</div>
    `;

    historyList?.appendChild(li);
  });
}

async function fetchJson(url) {
  console.log('📡 fetch:', url);
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });

  console.log(`📡 response: ${url} -> ${response.status}`);
  
  if (!response.ok) {
    throw new Error(`${url} -> ${response.status}`);
  }

  const json = await response.json();
  console.log(`📡 json received from ${url}:`, json);
  return json;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`${url} -> ${response.status}`);
  }

  return response.json();
}

async function loadWhoopRaw() {
  const whoopUserId = getCurrentWhoopUserId();
  const url = makeUrl('/api/whoop-data', { whoopUserId });

  try {
    setStatus('warn', 'Loading WHOOP', 'Fetching raw WHOOP payload...');
    const data = await fetchJson(url);
    if (whoopRawPre) {
      whoopRawPre.textContent = JSON.stringify(data, null, 2);
    }
    setStatus('ok', 'WHOOP loaded', 'Raw WHOOP payload loaded.');
  } catch (error) {
    if (whoopRawPre) {
      whoopRawPre.textContent = `Failed to load WHOOP payload: ${error.message}`;
    }
    setStatus('bad', 'WHOOP failed', error.message || 'Unable to load WHOOP payload.');
  }
}

async function runCoachAgent() {
  const memberId = getCurrentWhoopUserId();
  const coachPrompt = coachPromptInput?.value?.trim();
  const sport = sportInput?.value?.trim() || 'functional-fitness';
  const bookingDate = bookingDateInput?.value || '2026-04-21';
  const durationMinutes = Number(bookingDurationInput?.value || 45);

  if (!coachPrompt) {
    setStatus('warn', 'Coach prompt required', 'Enter a coach prompt before running the AI Coach agent.');
    return;
  }

  const url = makeUrl('/api/coach-prompt-agent');
  const body = {
    member_id: memberId,
    coach_prompt: coachPrompt,
    sport,
    booking: {
      date: bookingDate,
      duration_minutes: durationMinutes
    }
  };

  if (coachAgentBtn) coachAgentBtn.disabled = true;
  setStatus('warn', 'AI Coach running', 'Generating a custom session from coach prompt...');

  try {
    const result = await postJson(url, body);
    renderCoachSession(result);
  } catch (error) {
    setStatus('bad', 'AI Coach failed', error.message || 'Unable to run coach prompt agent.');
    setWorkflowMeta('Workflow ID: generation failed');
  } finally {
    if (coachAgentBtn) coachAgentBtn.disabled = false;
  }
}

async function loadLiveData(options = {}) {
  const { forceFresh = false } = options;
  const whoopUserId = getCurrentWhoopUserId();
  const includeFallback = Boolean(showWhoopRawToggle?.checked);

  window.localStorage.setItem(STORAGE_KEY, whoopUserId);
  setAthleteName(`Athlete ${whoopUserId}`);

  const adaptiveUrl = makeUrl('/api/get-adaptive-session', {
    whoopUserId,
    bust: forceFresh ? Date.now() : undefined
  });
  const whoopUrl = makeUrl('/api/whoop-data', { whoopUserId });
  const historyUrl = makeUrl('/api/session-history', {
    whoopUserId,
    includeFallback: includeFallback ? 'true' : undefined
  });

  console.log('🔄 loadLiveData:', { adaptiveUrl, whoopUrl, historyUrl });
  refreshBtn.disabled = true;
  if (reconnectBtn) reconnectBtn.disabled = true;
  setStatus('warn', forceFresh ? 'Generating new session' : 'Syncing', forceFresh ? 'Requesting a fresh WHOOP pull and new session insert...' : 'Loading adaptive session, WHOOP snapshot, and history...');

  try {
    const [adaptiveResult, whoopResult, historyResult] = await Promise.allSettled([
      fetchJson(adaptiveUrl),
      fetchJson(whoopUrl),
      fetchJson(historyUrl)
    ]);

    console.log('📦 API Results:', { adaptiveResult, whoopResult, historyResult });

    if (adaptiveResult.status !== 'fulfilled') {
      throw adaptiveResult.reason;
    }

    const adaptiveSession = adaptiveResult.value;
    console.log('✅ Adaptive session payload:', adaptiveSession);
    renderAdaptiveSession(adaptiveSession);

    const whoopPayload = whoopResult.status === 'fulfilled' ? whoopResult.value : null;
    const historyPayload = historyResult.status === 'fulfilled' ? historyResult.value : null;
    const whoopAuthError = whoopPayload ? getWhoopAuthError(whoopPayload) : '';
    setAthleteName(resolveAthleteName(whoopPayload, adaptiveSession, historyPayload, whoopUserId));

    if (whoopResult.status === 'fulfilled') {
      renderWhoopSnapshot(whoopPayload);
    } else {
      renderWhoopSnapshot(null);
    }

    evaluateTelemetryOverrides(adaptiveSession, whoopPayload);

    if (historyResult.status === 'fulfilled') {
      renderHistory(historyResult.value);
    } else {
      renderHistory([]);
    }

    const source = sourceFromAdaptivePayload(adaptiveSession);
    const sourceText = source === 'whoop' ? 'Live WHOOP' : 'Fallback';
    const historyCount = historyResult.status === 'fulfilled' && Array.isArray(historyResult.value)
      ? Math.min(historyResult.value.length, 5)
      : 0;

    if (whoopResult.status === 'rejected' || historyResult.status === 'rejected') {
      const degraded = [
        whoopResult.status === 'rejected' ? 'whoop-data' : null,
        historyResult.status === 'rejected' ? 'session-history' : null
      ].filter(Boolean).join(', ');
      setStatus('warn', source === 'whoop' ? 'Partial live sync' : 'Fallback session', `Main card source: ${sourceText}. Partial data: ${degraded}. History rows: ${historyCount}${includeFallback ? ' (debug fallback rows enabled)' : ''}.`);
    } else if (whoopAuthError) {
      setStatus('warn', 'WHOOP auth required', `${whoopAuthError}. Reconnect WHOOP to restore live physiology sync.`);
    } else {
      setStatus(source === 'whoop' ? 'ok' : 'warn', source === 'whoop' ? 'Live WHOOP connected' : 'Fallback session', `Main card source: ${sourceText}. History rows: ${historyCount}${includeFallback ? ' (debug fallback rows enabled)' : ''}.`);
    }
  } catch (error) {
    console.error('❌ loadLiveData error:', error);
    setStatus('bad', 'Sync failed', error.message || 'Unable to load adaptive APIs.');
    setAthleteName(`Athlete ${whoopUserId}`);
    renderAdaptiveSession({
      readiness: 'UNKNOWN',
      session: { session_title: 'Delta Zone - Session unavailable', intensity: '-', focus: '-', blocks: [], finisher: '-' }
    });
    renderWhoopSnapshot(null);
    renderHistory([]);
  } finally {
    refreshBtn.disabled = false;
    if (reconnectBtn) reconnectBtn.disabled = false;
  }
}

function initUserId() {
  const cachedUserId = window.localStorage.getItem(STORAGE_KEY);
  if (cachedUserId && whoopUserIdInput) {
    whoopUserIdInput.value = cachedUserId;
    return;
  }
  if (whoopUserIdInput) {
    whoopUserIdInput.value = DEFAULT_WHOOP_USER_ID;
  }
}

function syncWhoopRawVisibility() {
  if (!whoopRawPanel || !showWhoopRawToggle) return;
  whoopRawPanel.hidden = !showWhoopRawToggle.checked;
  if (showWhoopRawToggle.checked) {
    loadWhoopRaw();
  }
}

function attachButtonGlow() {
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.remove('ui-click-glow');
      void button.offsetWidth;
      button.classList.add('ui-click-glow');
    });
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener('click', () => loadLiveData({ forceFresh: true }));
}

if (reconnectBtn) {
  reconnectBtn.addEventListener('click', () => {
    window.location.href = WHOOP_AUTH_URL;
  });
}

if (showWhoopRawToggle) {
  showWhoopRawToggle.addEventListener('change', syncWhoopRawVisibility);
}

if (telemetryOverlayClose) {
  telemetryOverlayClose.addEventListener('click', () => {
    telemetryOverlay?.classList.remove('show');
  });
}

initUserId();
setWorkflowMeta('Workflow ID: not generated');
applyUiCopy();
attachButtonGlow();
syncWhoopRawVisibility();
loadLiveData();
scheduleTelemetryPolling();

if (coachAgentBtn) {
  coachAgentBtn.addEventListener('click', runCoachAgent);
}
