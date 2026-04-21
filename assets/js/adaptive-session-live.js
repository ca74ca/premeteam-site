const whoopUserIdInput = document.getElementById('whoopUserIdInput');
const showWhoopRawToggle = document.getElementById('showWhoopRawToggle');
const refreshBtn = document.getElementById('refreshBtn');
const reconnectBtn = document.getElementById('reconnectBtn');
const coachAgentBtn = document.getElementById('coachAgentBtn');

const statusText = document.getElementById('statusText');
const liveWhoopPill = document.getElementById('liveWhoopPill');
const liveWhoopLabel = document.getElementById('liveWhoopLabel');
const heroAthleteName = document.getElementById('heroAthleteName');

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
const heartRateValue = document.getElementById('heartRateValue');
const deltaZoneMinutesValue = document.getElementById('deltaZoneMinutesValue');
const deltaZoneRatioValue = document.getElementById('deltaZoneRatioValue');
const loadPenaltyValue = document.getElementById('loadPenaltyValue');
const scoringBreakdownValue = document.getElementById('scoringBreakdownValue');

const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const whoopRawPanel = document.getElementById('whoopRawPanel');
const whoopRawPre = document.getElementById('whoopRawPre');

const STORAGE_KEY = 'adaptiveSessionLiveUserId';
const DEFAULT_WHOOP_USER_ID = String(window.DELTA_WHOOP_USER_ID || '1243444');

function resolveApiBase() {
  const explicitRoot = window.DELTA_AGENT_API_ROOT || '';
  if (explicitRoot && /^https?:\/\//i.test(explicitRoot)) {
    return explicitRoot.replace(/\/$/, '');
  }

  const { protocol, hostname } = window.location;
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

function setReadiness(readiness) {
  if (!readinessChip) return;
  const value = String(readiness || 'UNKNOWN').toUpperCase();
  const cls = value === 'HIGH' ? 'high' : value === 'MODERATE' ? 'moderate' : value === 'LOW' ? 'low' : 'unknown';
  readinessChip.className = `readiness-chip ${cls}`;
  readinessChip.textContent = `Readiness ${value}`;
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
  const readiness = String(payload?.readiness || 'UNKNOWN').toUpperCase();
  if (payload?.whoop && readiness !== 'UNKNOWN') return 'whoop';
  return 'fallback';
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

  setReadiness(readiness);
  setSource(sourceFromAdaptivePayload(payload));

  if (sessionTitle) sessionTitle.textContent = session.session_title || 'Delta Zone session unavailable';
  if (sessionIntensity) sessionIntensity.textContent = session.intensity || '-';
  if (sessionFocus) sessionFocus.textContent = session.focus || '-';
  if (sessionFinisher) sessionFinisher.textContent = session.finisher || '-';

  if (sessionBlocks) {
    const blocks = Array.isArray(session.blocks) ? session.blocks.filter(Boolean) : [];
    sessionBlocks.innerHTML = blocks.length
      ? blocks.map((block) => `<li class="block-item">${block}</li>`).join('')
      : '<li class="block-item">No blocks returned by API.</li>';
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
  const mainWorkout = Array.isArray(sessionOutput.main_workout) ? sessionOutput.main_workout : [];
  const blockItems = mainWorkout.flatMap((block) => {
    const blockLabel = block?.block || 'Block';
    const exercises = Array.isArray(block?.exercises) ? block.exercises : [];
    if (!exercises.length) {
      return [blockLabel];
    }
    return exercises.map((exercise) => {
      const sets = exercise?.sets || exercise?.rounds || '';
      const reps = exercise?.reps || exercise?.duration || '';
      const effort = exercise?.effort || '';
      return `${blockLabel}: ${exercise?.name || 'Exercise'}${sets ? ` · ${sets}` : ''}${reps ? ` · ${reps}` : ''}${effort ? ` · ${effort}` : ''}`;
    });
  });

  setReadiness(memberContext?.readiness_score ? 'MODERATE' : 'UNKNOWN');
  setSource('coach');
  if (sessionTitle) {
    sessionTitle.textContent = sessionOutput.session_focus || programmingLogic.session_objective || sessionOutput.coach_summary || 'AI Coach session generated';
  }
  if (sessionIntensity) {
    sessionIntensity.textContent = sessionOutput.session_intensity || programmingLogic.intensity || '-';
  }
  if (sessionFocus) {
    sessionFocus.textContent = programmingLogic.training_mode || sessionOutput.session_intent || memberContext.primary_goal || '-';
  }
  if (sessionFinisher) {
    const finisher = Array.isArray(sessionOutput.cooldown) && sessionOutput.cooldown.length
      ? sessionOutput.cooldown.flatMap((block) => block?.items || []).join(' | ')
      : (sessionOutput.coach_summary || '-');
    sessionFinisher.textContent = finisher || '-';
  }
  if (sessionBlocks) {
    sessionBlocks.innerHTML = blockItems.length
      ? blockItems.map((item) => `<li class="block-item">${item}</li>`).join('')
      : '<li class="block-item">No blocks returned by AI Coach agent.</li>';
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
      <div class="history-meta">Readiness: ${readiness} | Intensity: ${item?.session?.intensity || '-'}</div>
      <div class="history-meta">Readiness score: ${readinessScore === '-' ? '0.0' : readinessScore} | ${zoneClassifier} | ${loadTier}</div>
    `;

    historyList?.appendChild(li);
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`${url} -> ${response.status}`);
  }

  return response.json();
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

  refreshBtn.disabled = true;
  if (reconnectBtn) reconnectBtn.disabled = true;
  setStatus('warn', forceFresh ? 'Generating new session' : 'Syncing', forceFresh ? 'Requesting a fresh WHOOP pull and new session insert...' : 'Loading adaptive session, WHOOP snapshot, and history...');

  try {
    const [adaptiveResult, whoopResult, historyResult] = await Promise.allSettled([
      fetchJson(adaptiveUrl),
      fetchJson(whoopUrl),
      fetchJson(historyUrl)
    ]);

    if (adaptiveResult.status !== 'fulfilled') {
      throw adaptiveResult.reason;
    }

    const adaptiveSession = adaptiveResult.value;
    renderAdaptiveSession(adaptiveSession);

    const whoopPayload = whoopResult.status === 'fulfilled' ? whoopResult.value : null;
    const historyPayload = historyResult.status === 'fulfilled' ? historyResult.value : null;
    setAthleteName(resolveAthleteName(whoopPayload, adaptiveSession, historyPayload, whoopUserId));

    if (whoopResult.status === 'fulfilled') {
      renderWhoopSnapshot(whoopPayload);
    } else {
      renderWhoopSnapshot(null);
    }

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
    } else {
      setStatus(source === 'whoop' ? 'ok' : 'warn', source === 'whoop' ? 'Live WHOOP connected' : 'Fallback session', `Main card source: ${sourceText}. History rows: ${historyCount}${includeFallback ? ' (debug fallback rows enabled)' : ''}.`);
    }
  } catch (error) {
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
  loadLiveData();
}

if (refreshBtn) {
  refreshBtn.addEventListener('click', () => loadLiveData({ forceFresh: true }));
}

if (reconnectBtn) {
  reconnectBtn.addEventListener('click', () => loadLiveData());
}

if (showWhoopRawToggle) {
  showWhoopRawToggle.addEventListener('change', syncWhoopRawVisibility);
}

initUserId();
setWorkflowMeta('Workflow ID: not generated');
syncWhoopRawVisibility();
loadLiveData();

if (coachAgentBtn) {
  coachAgentBtn.addEventListener('click', runCoachAgent);
}
