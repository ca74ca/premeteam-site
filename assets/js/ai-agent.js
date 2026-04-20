const buildSessionBtn = document.getElementById('buildSessionBtn');
const sessionOutput = document.getElementById('sessionOutput');
const connectionLabel = document.getElementById('connectionLabel');
const gymSelectInput = document.getElementById('gymSelectInput');
const athleteSelectInput = document.getElementById('athleteSelectInput');
const coachNameInput = document.getElementById('coachNameInput');
const durationInput = document.getElementById('durationInput');
const backendUrlField = document.getElementById('backendUrlField');
const backendUrlInput = document.getElementById('backendUrlInput');
const coachPromptInput = document.getElementById('coachPromptInput');

const athleteNameEl = document.getElementById('athleteName');
const athleteSubEl = document.getElementById('athleteSub');
const gymLocationValueEl = document.getElementById('gymLocationValue');
const coachDisplayEl = document.getElementById('coachDisplay');
const wearableValueEl = document.getElementById('wearableValue');
const wearableDotEl = document.getElementById('wearableDot');
const wearableIndicatorTextEl = document.getElementById('wearableIndicatorText');
const membershipValueEl = document.getElementById('membershipValue');
const membershipDotEl = document.getElementById('membershipDot');
const membershipIndicatorTextEl = document.getElementById('membershipIndicatorText');
const engagementValueEl = document.getElementById('engagementValue');
const engagementDotEl = document.getElementById('engagementDot');
const engagementIndicatorTextEl = document.getElementById('engagementIndicatorText');
const sessionsUsedValueEl = document.getElementById('sessionsUsedValue');
const sessionWindowEl = document.getElementById('sessionWindowValue');
const decisionTextEl = document.getElementById('decisionText');
const poheNumberEl = document.getElementById('poheNumber');
const poheStatusEl = document.getElementById('poheStatus');
const recoveryValueEl = document.getElementById('recoveryValue');
const recoveryLabelEl = document.getElementById('recoveryLabel');
const sleepValueEl = document.getElementById('sleepValue');
const sleepScoreEl = document.getElementById('sleepScore');
const hrvValueEl = document.getElementById('hrvValue');
const hrvScoreEl = document.getElementById('hrvScore');
const goalValueEl = document.getElementById('goalValue');
const lastStrengthValueEl = document.getElementById('lastStrengthValue');
const classSessionValueEl = document.getElementById('classSessionValue');
const recentWorkoutsListEl = document.getElementById('recentWorkoutsList');
const objectiveValueEl = document.getElementById('objectiveValue');
const whyTodayValueEl = document.getElementById('whyTodayValue');
const modeValueEl = document.getElementById('modeValue');
const constraintValueEl = document.getElementById('constraintValue');
const coachNoteValueEl = document.getElementById('coachNoteValue');

const athletePayload = {
  member_id: 'delta-athlete-001',
  coach_name: 'Coach Delta',
  duration_min: 40,
  session_type: 'personal_coaching',
  intake: {
    primary_goal: 'HYROX performance',
    secondary_goals: ['strength', 'VO2 max'],
    experience_level: 'intermediate',
    age: 32,
    available_equipment: ['rower', 'skiErg', 'bike', 'dumbbells', 'sled', 'wall ball']
  },
  wearable: {
    provider: 'WHOOP',
    connected: true,
    recovery_score: 82,
    sleep_hours: 7.6,
    hrv_score: 61,
    soreness: 3,
    athlete_feels_fresh: true
  },
  class_history: {
    classes_booked_30_days: 8,
    classes_attended_30_days: 7,
    classes_missed_30_days: 1,
    late_cancels_30_days: 0,
    class_type_breakdown: { hyrox: 3, strength: 2, conditioning: 2 },
    avg_session_duration: 45,
    avg_active_minutes: 37
  },
  fatigue: {
    lower_body: 58,
    upper_body: 24,
    cns: 34,
    aerobic: 40,
    recent_heavy_legs: true
  },
  recent_training: {
    last_vo2_days_ago: 4,
    last_race_style_days_ago: 5,
    last_max_effort_days_ago: 7,
    lower_body_heavy_last_48h: false,
    cardio_heavy_sessions_this_week: 1,
    strength_heavy_sessions_this_week: 2
  },
  recent_performance: {
    completed_without_failure: true,
    session_rpe: 7,
    movement_quality_score: 82,
    failed_reps: 0
  },
  recentWorkouts: [
    'Tempo Run · 35 min',
    'Sled Push Intervals · 6 rounds',
    'Upper Body Strength · 45 min'
  ],
  previous_lifts: [
    {
      name: 'Back Squat',
      last_load: 175,
      best_load: 175,
      last_reps: 1,
      last_rpe: 9,
      days_ago: 7
    }
  ]
};

const BACKEND_URL_STORAGE_KEY = 'deltaAgentBackendUrl';
const AGENT_CACHE_STORAGE_PREFIX = 'deltaAgentCache';
const fallbackGyms = [
  { id: 'gym-delta-zone', name: 'Delta Zone Systems' }
];
const fallbackAthletesByGym = {
  'gym-delta-zone': [
    {
      id: 'delta-athlete-001',
      name: 'Jordan Athlete',
      coach_name: 'Coach Delta',
      experience_level: 'intermediate',
      primary_goal: 'HYROX performance'
    },
    {
      id: 'delta-athlete-002',
      name: 'Avery Runner',
      coach_name: 'Coach Delta',
      experience_level: 'advanced',
      primary_goal: 'Race-day stamina'
    }
  ]
};

let currentApiRoot = '';
let currentAthleteContext = null;
let loadedAthletes = [];
let coachPromptDirty = false;

function isProductionHost() {
  return window.location.hostname.includes('deltazonesystem.com');
}

function resolveVaracisEndpoint() {
  const savedUrl = typeof window !== 'undefined'
    ? window.localStorage.getItem(BACKEND_URL_STORAGE_KEY)
    : '';

  if (savedUrl && /^https?:\/\//i.test(savedUrl)) return savedUrl;
  if (window.DELTA_AGENT_API_URL) return window.DELTA_AGENT_API_URL;

  const { protocol, hostname } = window.location;
  if (hostname.includes('deltazonesystem.com')) {
    return 'https://www.varacis.com/api/coach-prompt-agent';
  }
  if (hostname.includes('.app.github.dev')) {
    const backendHost = hostname.replace(/-\d+\.app\.github\.dev$/, '-3000.app.github.dev');
    return `${protocol}//${backendHost}/api/coach-prompt-agent`;
  }
  return 'http://localhost:3000/api/coach-prompt-agent';
}

function getApiRoot(apiEndpoint) {
  try {
    const url = new URL(apiEndpoint, window.location.origin);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    return window.location.origin;
  }
}

function safeId(value, fallbackValue) {
  const text = String(value || '').trim();
  return text || fallbackValue;
}

function storageKey(athleteId) {
  return `${AGENT_CACHE_STORAGE_PREFIX}:${safeId(athleteId, 'default')}`;
}

function readStorageJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writeStorageJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage failures.
  }
}

function getSelectedGym() {
  return {
    id: gymSelectInput?.value?.trim() || 'gym-delta-zone',
    name: gymSelectInput?.selectedOptions?.[0]?.textContent?.trim() || 'Delta Zone Systems'
  };
}

function getSelectedAthlete() {
  const athleteId = athleteSelectInput?.value?.trim();
  return loadedAthletes.find((athlete) => athlete.id === athleteId) || null;
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function uniqueStrings(values) {
  return Array.from(new Set(values.map((value) => String(value).trim()).filter(Boolean)));
}

function getCachedAgentBundle(athleteId) {
  return readStorageJson(storageKey(athleteId));
}

function getCachedAgentResponse(athleteId) {
  return getCachedAgentBundle(athleteId)?.response || null;
}

function hydrateCoachPromptFromCache(athleteId) {
  if (coachPromptDirty) return;
  const cachedPrompt = getCachedAgentBundle(athleteId)?.coachPrompt;
  if (!cachedPrompt || !coachPromptInput) return;
  coachPromptInput.value = cachedPrompt;
}

function collectCoachNotes(data) {
  const member = data?.member_context || {};
  const session = data?.session_output || {};
  const promptAgent = session?.coach_prompt_agent || {};
  return uniqueStrings([
    ...toArray(session.delta_zone_notes),
    ...toArray(session.coach_cues),
    promptAgent.assistant_reply,
    promptAgent.prompt_summary,
    member.coach_prompt_summary,
    member.context_summary
  ]);
}

function persistAgentBundle(athleteId, payload, response) {
  writeStorageJson(storageKey(athleteId), {
    savedAt: new Date().toISOString(),
    coachPrompt: payload.coach_prompt || '',
    notes: collectCoachNotes(response),
    response
  });
}

function normalizeGym(rawGym, index) {
  return {
    id: safeId(rawGym?.id || rawGym?.gym_id || rawGym?.slug, `gym-${index + 1}`),
    name: String(rawGym?.name || rawGym?.gym_name || rawGym?.title || `Gym ${index + 1}`)
  };
}

function normalizeAthlete(rawAthlete, index) {
  const athleteId = safeId(rawAthlete?.id || rawAthlete?.member_id || rawAthlete?.athlete_id, `athlete-${index + 1}`);
  return {
    id: athleteId,
    name: String(rawAthlete?.name || rawAthlete?.full_name || rawAthlete?.member_name || athleteId),
    coach_name: String(rawAthlete?.coach_name || rawAthlete?.coach || athletePayload.coach_name),
    experience_level: String(rawAthlete?.experience_level || athletePayload.intake.experience_level),
    primary_goal: String(rawAthlete?.primary_goal || athletePayload.intake.primary_goal)
  };
}

function setSelectOptions(selectNode, options, placeholderLabel) {
  if (!selectNode) return;
  const renderedOptions = [`<option value="">${placeholderLabel}</option>`]
    .concat(options.map((option) => `<option value="${option.id}">${option.name}</option>`));
  selectNode.innerHTML = renderedOptions.join('');
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

function unwrapPayload(result) {
  if (!result || typeof result !== 'object') return result;
  if (result.data && typeof result.data === 'object') return result.data;
  if (result.payload && typeof result.payload === 'object') return result.payload;
  return result;
}

function firstArrayFromObject(result, keys) {
  const payload = unwrapPayload(result);
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

async function fetchJsonFromCandidates(urls) {
  let lastError = null;
  for (const url of urls) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No valid endpoint candidates');
}

function setText(node, value) {
  if (!node || value === undefined || value === null || value === '') return;
  node.textContent = String(value);
}

function clipText(value, maxLength = 180) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;
}

function setRosterStatus(label, tone) {
  if (!connectionLabel) return;
  connectionLabel.textContent = label;
  const chip = connectionLabel.closest('.api-chip');
  if (!chip) return;
  chip.style.background = tone === 'warning' ? 'rgba(245,158,11,0.16)' : 'rgba(34,197,94,0.12)';
  chip.style.borderColor = tone === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(96,255,161,0.18)';
}

function setDotState(dotNode, labelNode, tone, text) {
  if (dotNode) {
    dotNode.classList.remove('green', 'amber', 'red');
    dotNode.classList.add(tone || 'amber');
  }
  setText(labelNode, text);
}

function getScoreColor(score) {
  if (score <= 40) return 'red';
  if (score <= 75) return 'orange';
  return 'green';
}

function renderMetricDots() {
  const metrics = document.querySelectorAll('.metric-with-dots');
  metrics.forEach((metric) => {
    const score = Number(metric.dataset.score || 0);
    const dotWrap = metric.querySelector('.progress-dots');
    if (!dotWrap) return;

    const activeDots = Math.max(1, Math.min(6, Math.round((score / 100) * 6)));
    const colorClass = getScoreColor(score);
    dotWrap.innerHTML = '';

    for (let index = 0; index < 6; index += 1) {
      const dot = document.createElement('span');
      dot.className = 'progress-dot';
      if (index < activeDots) {
        dot.classList.add('active', colorClass);
      }
      dotWrap.appendChild(dot);
    }
  });
}

function fallbackContextForAthlete(athlete) {
  const selectedAthlete = athlete || {};
  const durationMin = Number(durationInput?.value || athletePayload.duration_min);
  const readinessScore = athletePayload.wearable.recovery_score;

  return {
    persisted: false,
    member_context: {
      member_id: selectedAthlete.id || athletePayload.member_id,
      coach_name: selectedAthlete.coach_name || coachNameInput?.value || athletePayload.coach_name,
      duration_min: durationMin,
      experience_level: selectedAthlete.experience_level || athletePayload.intake.experience_level,
      primary_goal: selectedAthlete.primary_goal || athletePayload.intake.primary_goal,
      readiness_score: readinessScore,
      pohe_engagement_score: 91,
      engagement_score: 62,
      engagement_focus: 'ENGAGED',
      member_type: 'Preview athlete',
      data_sources_used: ['preview_mode'],
      recovery_signals: {
        sleep_hours: athletePayload.wearable.sleep_hours,
        hrv_score: athletePayload.wearable.hrv_score
      },
      previous_lifts: athletePayload.previous_lifts,
      recent_training_balance: {
        cardio_heavy_sessions_this_week: athletePayload.recent_training.cardio_heavy_sessions_this_week,
        strength_heavy_sessions_this_week: athletePayload.recent_training.strength_heavy_sessions_this_week
      },
      context_summary: 'Preview mode context generated locally.'
    },
    session_output: {
      session_focus: 'Hybrid strength + threshold control',
      session_intensity: 'MODERATE',
      coach_summary: 'Preview context loaded. Connect API endpoints for full live roster and session history.',
      session_intent: 'Train quality while protecting fatigue limits.',
      constraints_applied: ['Keep posterior chain volume controlled'],
      coach_cues: ['Respect RPE caps', 'Trim volume if quality drops'],
      delta_zone_notes: ['Preview mode active', 'Live backend response not available yet'],
      data_insights: {
        readiness_score: readinessScore,
        pohe_engagement_score: 91,
        pohe_verified: false
      },
      coach_prompt_agent: {
        prompt_summary: 'Preview mode context generated locally.',
        assistant_reply: 'Use cached notes and live backend sync to replace this preview.'
      },
      main_workout: [
        {
          block: 'Block A',
          exercises: [
            { name: 'SkiErg threshold interval', sets: '4', reps: '5 minutes', effort: 'RPE 6-7' },
            { name: 'Sled push', sets: '4', reps: '20m', effort: 'Controlled hard effort' }
          ]
        }
      ]
    },
    programming_logic: {
      training_mode: 'HYROX',
      intensity: 'MODERATE',
      session_objective: 'Engine quality with controlled strength work',
      recovery_status: 'Preview Readiness',
      constraints_applied: ['Avoid junk volume']
    }
  };
}

function normalizeWorkoutResponse(result, fallbackAthlete) {
  const payload = unwrapPayload(result) || {};
  const fallback = fallbackContextForAthlete(fallbackAthlete);
  const member = payload.member_context || payload.member || payload.athlete || payload.profile || {};
  const session = payload.session_output || payload.session || payload.workout || payload.plan || {};
  const logic = payload.programming_logic || payload.logic || payload.programming || {};
  const recovery = member.recovery_signals || member.recovery || {};

  return {
    workflow_id: payload.workflow_id || null,
    trigger_status: payload.trigger_status || null,
    booking: payload.booking || null,
    persisted: Boolean(payload.persisted),
    member_context: {
      ...fallback.member_context,
      ...member,
      member_id: member.member_id || member.id || fallback.member_context.member_id,
      coach_name: member.coach_name || member.coach || fallback.member_context.coach_name,
      duration_min: member.duration_min || payload.duration_min || fallback.member_context.duration_min,
      experience_level: member.experience_level || fallback.member_context.experience_level,
      primary_goal: member.primary_goal || fallback.member_context.primary_goal,
      readiness_score: member.readiness_score ?? session.readiness_score ?? recovery.recovery_score ?? fallback.member_context.readiness_score,
      pohe_engagement_score: member.pohe_engagement_score ?? payload.pohe_engagement_score ?? fallback.member_context.pohe_engagement_score,
      recovery_signals: {
        ...fallback.member_context.recovery_signals,
        ...recovery
      },
      previous_lifts: Array.isArray(member.previous_lifts) && member.previous_lifts.length
        ? member.previous_lifts
        : fallback.member_context.previous_lifts,
      recent_training_balance: {
        ...fallback.member_context.recent_training_balance,
        ...(member.recent_training_balance || {})
      }
    },
    session_output: {
      ...fallback.session_output,
      ...session,
      coach_prompt_agent: {
        ...fallback.session_output.coach_prompt_agent,
        ...(session.coach_prompt_agent || {})
      },
      data_insights: {
        ...fallback.session_output.data_insights,
        ...(session.data_insights || {})
      },
      constraints_applied: Array.isArray(session.constraints_applied)
        ? session.constraints_applied
        : fallback.session_output.constraints_applied,
      coach_cues: Array.isArray(session.coach_cues)
        ? session.coach_cues
        : fallback.session_output.coach_cues,
      delta_zone_notes: Array.isArray(session.delta_zone_notes)
        ? session.delta_zone_notes
        : fallback.session_output.delta_zone_notes,
      main_workout: Array.isArray(session.main_workout)
        ? session.main_workout
        : fallback.session_output.main_workout,
      warmup: Array.isArray(session.warmup) ? session.warmup : [],
      cooldown: Array.isArray(session.cooldown) ? session.cooldown : []
    },
    programming_logic: {
      ...fallback.programming_logic,
      ...logic,
      constraints_applied: Array.isArray(logic.constraints_applied)
        ? logic.constraints_applied
        : fallback.programming_logic.constraints_applied
    }
  };
}

function formatSessionCount(member, session) {
  const analyticsCount = Number(session?.analytics?.sessions_used);
  if (!Number.isNaN(analyticsCount) && analyticsCount > 0) return analyticsCount;

  const balance = member?.recent_training_balance || {};
  const derivedCount = Number(balance.cardio_heavy_sessions_this_week || 0) + Number(balance.strength_heavy_sessions_this_week || 0);
  if (derivedCount > 0) return derivedCount;

  return Number(athletePayload.class_history.classes_attended_30_days || 0);
}

function getWorkoutPreviewItems(session) {
  if (!Array.isArray(session?.main_workout)) return athletePayload.recentWorkouts;
  return session.main_workout
    .flatMap((block) => (block.exercises || []).slice(0, 2).map((exercise) => `${block.block} · ${exercise.name}`))
    .slice(0, 3);
}

function applyLiveContext(data) {
  currentAthleteContext = data;

  const member = data?.member_context || {};
  const session = data?.session_output || {};
  const logic = data?.programming_logic || {};
  const promptAgent = session?.coach_prompt_agent || {};
  const dataInsights = session?.data_insights || {};
  const recovery = member?.recovery_signals || {};
  const lifts = Array.isArray(member.previous_lifts) ? member.previous_lifts : [];
  const selectedAthlete = getSelectedAthlete();
  const selectedGym = getSelectedGym();
  const recentWorkoutItems = getWorkoutPreviewItems(session);
  const engagementScore = Number(member.engagement_score ?? 0);
  const readiness = dataInsights.readiness_score ?? session.readiness_score ?? member.readiness_score ?? athletePayload.wearable.recovery_score;
  const sleepHours = recovery.sleep_hours ?? athletePayload.wearable.sleep_hours;
  const hrvScore = recovery.hrv_score ?? athletePayload.wearable.hrv_score;
  const liveWearable = !(member.data_sources_used || []).includes('no_live_wearable');
  const sessionCount = formatSessionCount(member, session);
  const noteSummary = collectCoachNotes(data);
  const engagementLabel = member.engagement_focus || (engagementScore >= 60 ? 'ENGAGED' : 'NEEDS_ATTENTION');

  setText(athleteNameEl, selectedAthlete?.name || member.name || member.full_name || member.member_id || athletePayload.member_id);
  setText(athleteSubEl, `${member.experience_level || selectedAthlete?.experience_level || athletePayload.intake.experience_level} · ${logic.training_mode || session.training_mode || 'coach-facing view'}`);
  setText(gymLocationValueEl, `${selectedGym.name} · ${session.delivery_target || member.session_type || 'Personal coaching'}`);
  setText(coachDisplayEl, `${member.coach_name || coachNameInput?.value || athletePayload.coach_name} · ${logic.training_mode || session.training_mode || 'Session ready'}`);
  setText(sessionWindowEl, `${member.duration_min || durationInput?.value || athletePayload.duration_min}m`);
  setText(decisionTextEl, clipText(session.coach_summary || session.session_intent || 'Session built from live Varacis context.', 190));
  setText(poheNumberEl, dataInsights.pohe_engagement_score ?? member.pohe_engagement_score ?? 0);
  setText(poheStatusEl, dataInsights.pohe_verified ? 'Verified / high trust signal' : 'Proxy / live data signal');

  setText(wearableValueEl, liveWearable ? 'Live recovery signal connected' : 'Proxy recovery signal only');
  setDotState(wearableDotEl, wearableIndicatorTextEl, liveWearable ? 'green' : 'amber', liveWearable ? 'Live' : 'Proxy');
  setText(membershipValueEl, member.member_type || 'Active member profile');
  setDotState(membershipDotEl, membershipIndicatorTextEl, data?.persisted ? 'green' : 'amber', data?.persisted ? 'Active' : 'Preview');
  setText(engagementValueEl, `${engagementLabel.replace(/_/g, ' ').toLowerCase()} · score ${engagementScore || 0}`);
  setDotState(engagementDotEl, engagementIndicatorTextEl, engagementScore >= 60 ? 'green' : (engagementScore >= 30 ? 'amber' : 'red'), engagementScore >= 60 ? 'Engaged' : (engagementScore >= 30 ? 'Watch' : 'Low'));
  setText(sessionsUsedValueEl, sessionCount);

  setText(recoveryValueEl, `${readiness} / 100`);
  setText(recoveryLabelEl, logic.recovery_status || 'Readiness');
  setText(sleepValueEl, `${sleepHours} hours`);
  setText(sleepScoreEl, `${Math.round((Number(sleepHours || 0) / 8.5) * 100)} / 100`);
  setText(hrvValueEl, `${hrvScore} ms`);
  setText(hrvScoreEl, `${hrvScore} / 100`);
  setText(goalValueEl, member.primary_goal || athletePayload.intake.primary_goal);
  setText(lastStrengthValueEl, lifts[0] ? `${lifts[0].name} · ${lifts[0].last_load || '-'} lb x ${lifts[0].last_reps || '-'}` : `${athletePayload.previous_lifts[0].name} · 175 lb x 1`);
  setText(classSessionValueEl, `${sessionCount} tracked sessions in the current cycle`);
  setText(objectiveValueEl, session.session_focus || logic.session_objective || 'Session ready');
  setText(whyTodayValueEl, clipText(promptAgent.prompt_summary || member.context_summary || session.coach_summary || 'Built from readiness, training history, and coach input.', 170));
  setText(modeValueEl, `${logic.training_mode || '-'} · ${session.session_intensity || logic.intensity || '-'}`);
  setText(constraintValueEl, (session.constraints_applied || [])[0] || (logic.constraints_applied || [])[0] || 'Keep the session honest to fatigue.');
  setText(coachNoteValueEl, clipText(noteSummary[0] || (session.coach_cues || []).slice(0, 2).join(' · ') || 'Focus on RPE. Rest is mandatory.', 150));

  if (recentWorkoutsListEl) {
    recentWorkoutsListEl.innerHTML = recentWorkoutItems.map((item) => `<li>${item}</li>`).join('');
  }

  const metricBlocks = document.querySelectorAll('.metric-with-dots');
  if (metricBlocks[0]) metricBlocks[0].dataset.score = String(readiness);
  if (metricBlocks[1]) metricBlocks[1].dataset.score = String(Math.round((Number(sleepHours || 0) / 8.5) * 100));
  if (metricBlocks[2]) metricBlocks[2].dataset.score = String(Number(hrvScore || 0));
  renderMetricDots();
}

function renderWorkoutCard(data, sourceLabel) {
  const session = data?.session_output || {};
  const promptAgent = session?.coach_prompt_agent || {};
  const logic = data?.programming_logic || {};
  const notes = collectCoachNotes(data).slice(0, 6);
  const warmupMarkup = Array.isArray(session.warmup) && session.warmup.length
    ? `<span><strong>Warmup:</strong> ${session.warmup.map((block) => `${block.title} (${block.duration_min || '?'}m)`).join(' · ')}</span>`
    : '';
  const cooldownMarkup = Array.isArray(session.cooldown) && session.cooldown.length
    ? `<span><strong>Cooldown:</strong> ${session.cooldown.map((block) => `${block.title} (${block.duration_min || '?'}m)`).join(' · ')}</span>`
    : '';
  const mainSet = Array.isArray(session.main_workout)
    ? session.main_workout.flatMap((block) => (block.exercises || []).map((exercise) => `${block.block} · ${exercise.name} · ${exercise.sets || exercise.rounds || '-'} sets · ${exercise.reps || exercise.duration || '-'} · ${exercise.effort || 'Controlled'}`))
    : ['3 rounds · 500m row', '8 front squats', '10 burpees over erg'];
  const tags = [
    ...(promptAgent.workout_adjustments || []).slice(0, 3),
    ...(session.constraints_applied || []).slice(0, 1),
    ...(session.delta_zone_notes || []).slice(0, 2)
  ].slice(0, 4);

  applyLiveContext(data);

  sessionOutput.innerHTML = `
    <strong>${sourceLabel}</strong>
    <span><strong>Session objective:</strong> ${session.session_focus || logic.session_objective || 'Hybrid engine and strength development.'}</span>
    <span><strong>Why today:</strong> ${promptAgent.prompt_summary || session.coach_summary || 'Varacis returned a session build.'}</span>
    ${warmupMarkup}
    ${cooldownMarkup}
    <div class="result-meta-grid">
      <div class="result-meta-item"><small>Mode</small><strong>${logic.training_mode || '-'}</strong></div>
      <div class="result-meta-item"><small>Intensity</small><strong>${session.session_intensity || logic.intensity || '-'}</strong></div>
      <div class="result-meta-item"><small>Coach opening</small><strong>${session.coach_opening || 'Session ready'}</strong></div>
      <div class="result-meta-item"><small>Coach closing</small><strong>${session.coach_closing || 'Rest is mandatory.'}</strong></div>
    </div>
    <ul class="tight-list">${mainSet.map((item) => `<li>${item}</li>`).join('')}</ul>
    ${notes.length ? `<ul class="tight-list">${notes.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''}
    ${tags.length ? `<div class="compact-tags">${tags.map((item) => `<span>${item}</span>`).join('')}</div>` : ''}
  `;
}

function buildPayload() {
  const selectedAthleteId = athleteSelectInput?.value?.trim();
  const selectedGymId = gymSelectInput?.value?.trim();
  const member = currentAthleteContext?.member_context || {};
  const recovery = member.recovery_signals || {};
  const athleteId = selectedAthleteId || member.member_id || athletePayload.member_id;
  const cachedBundle = getCachedAgentBundle(athleteId);
  const cachedNotes = toArray(cachedBundle?.notes);

  return {
    ...athletePayload,
    booking_id: `dz-${Date.now()}`,
    gym_id: selectedGymId || 'gym-delta-zone',
    member_id: athleteId,
    coach_name: coachNameInput?.value?.trim() || member.coach_name || athletePayload.coach_name,
    duration_min: Number(durationInput?.value || athletePayload.duration_min),
    intake: {
      ...athletePayload.intake,
      experience_level: member.experience_level || athletePayload.intake.experience_level,
      primary_goal: member.primary_goal || athletePayload.intake.primary_goal
    },
    wearable: {
      ...athletePayload.wearable,
      recovery_score: member.readiness_score ?? athletePayload.wearable.recovery_score,
      sleep_hours: recovery.sleep_hours ?? athletePayload.wearable.sleep_hours,
      hrv_score: recovery.hrv_score ?? athletePayload.wearable.hrv_score
    },
    previous_lifts: Array.isArray(member.previous_lifts) && member.previous_lifts.length
      ? member.previous_lifts
      : athletePayload.previous_lifts,
    coach_prompt: coachPromptInput?.value?.trim() || '',
    coach_notes: coachPromptInput?.value?.trim() || '',
    ocache_notes: cachedNotes,
    cached_notes: cachedNotes,
    last_session_snapshot: cachedBundle?.response?.session_output || null
  };
}

async function fetchGyms(apiRoot) {
  const result = await fetchJsonFromCandidates([
    `${apiRoot}/api/gyms`,
    `${apiRoot}/gyms`,
    `${apiRoot}/api/v1/gyms`
  ]);
  return firstArrayFromObject(result, ['gyms', 'items', 'results', 'data']).map(normalizeGym).filter((gym) => gym.id);
}

async function fetchAthletes(apiRoot, gymId) {
  const encodedGymId = encodeURIComponent(gymId);
  const result = await fetchJsonFromCandidates([
    `${apiRoot}/api/gyms/${encodedGymId}/athletes`,
    `${apiRoot}/api/gyms/${encodedGymId}/members`,
    `${apiRoot}/gyms/${encodedGymId}/athletes`,
    `${apiRoot}/api/athletes?gym_id=${encodedGymId}`,
    `${apiRoot}/api/members?gym_id=${encodedGymId}`
  ]);
  return firstArrayFromObject(result, ['athletes', 'members', 'items', 'results', 'data']).map(normalizeAthlete).filter((athlete) => athlete.id);
}

async function buildSession(options = {}) {
  const { silent = false, trigger = 'manual' } = options;
  const apiEndpoint = getApiEndpoint();
  const payload = buildPayload();
  const athleteId = payload.member_id || athletePayload.member_id;
  const selectedAthlete = getSelectedAthlete();

  if (!silent) {
    buildSessionBtn.disabled = true;
    buildSessionBtn.textContent = 'Building Through Varacis...';
    connectionLabel.textContent = 'Calling Varacis';
    sessionOutput.innerHTML = `<strong>Generating Workout</strong><span>Varacis is reading wearable state, POHE, and coach input now via ${clipText(apiEndpoint, 80)}.</span>`;
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Backend request failed with ${response.status}`);
    }

    const rawData = await response.json();
    const data = normalizeWorkoutResponse(rawData, selectedAthlete);
    persistAgentBundle(athleteId, payload, rawData);
    setRosterStatus('Varacis connected', 'ok');
    renderWorkoutCard(data, trigger === 'manual' ? 'Workout Generated' : 'Live Session Synced');
  } catch (error) {
    const cachedResponse = getCachedAgentResponse(athleteId);
    if (cachedResponse) {
      setRosterStatus('Cached session loaded', 'warning');
      renderWorkoutCard(normalizeWorkoutResponse(cachedResponse, selectedAthlete), 'Cached Session Ready');
      return;
    }

    setRosterStatus('Preview mode', 'warning');
    renderWorkoutCard(normalizeWorkoutResponse({
      member_context: {
        member_id: athleteId,
        coach_name: payload.coach_name,
        duration_min: payload.duration_min,
        experience_level: payload.intake.experience_level,
        primary_goal: payload.intake.primary_goal,
        readiness_score: payload.wearable.recovery_score,
        pohe_engagement_score: 0,
        engagement_score: 27,
        engagement_focus: 'NEEDS_ATTENTION',
        member_type: 'Preview profile',
        recovery_signals: {
          sleep_hours: payload.wearable.sleep_hours,
          hrv_score: payload.wearable.hrv_score
        },
        previous_lifts: payload.previous_lifts,
        recent_training_balance: {
          cardio_heavy_sessions_this_week: athletePayload.recent_training.cardio_heavy_sessions_this_week,
          strength_heavy_sessions_this_week: athletePayload.recent_training.strength_heavy_sessions_this_week
        },
        data_sources_used: ['preview_mode', 'cached_notes']
      },
      session_output: {
        session_focus: 'Deload strength into HYROX engine work',
        session_intensity: 'MODERATE',
        coach_summary: 'Lower-body fatigue stays protected. Keep the engine focus high and work to target RPE.',
        coach_cues: ['Focus on RPE for movement', 'Rest is mandatory'],
        delta_zone_notes: toArray(payload.cached_notes).slice(0, 4),
        coach_prompt_agent: {
          prompt_summary: coachPromptInput?.value?.trim() || 'Coach note captured.',
          assistant_reply: 'Preview mode used the last cached notes because the backend was unavailable.'
        },
        main_workout: [
          {
            block: 'Block A',
            exercises: [
              { name: 'SkiErg threshold interval', sets: '4', reps: '5-6 minutes', effort: 'RPE 6-7' },
              { name: 'Single-arm DB row + suitcase carry', sets: '4', reps: '8-10 reps + 30s', effort: 'RPE 6-7' }
            ]
          }
        ]
      },
      programming_logic: {
        training_mode: 'HYROX',
        intensity: 'MODERATE',
        session_objective: 'Threshold engine with protected legs',
        recovery_status: 'Preview Readiness'
      }
    }, selectedAthlete), 'Preview Workout Ready');
  } finally {
    buildSessionBtn.disabled = false;
    buildSessionBtn.textContent = 'Build Today’s Session';
  }
}

async function loadAthleteContextForSelection() {
  const athleteId = athleteSelectInput?.value?.trim();
  if (!athleteId) {
    currentAthleteContext = null;
    return;
  }

  const selectedAthlete = getSelectedAthlete();
  if (selectedAthlete) {
    setText(athleteNameEl, selectedAthlete.name);
    setText(athleteSubEl, `${selectedAthlete.experience_level} athlete · loading live context`);
    if (!coachNameInput.value.trim() || coachNameInput.value.trim() === athletePayload.coach_name) {
      coachNameInput.value = selectedAthlete.coach_name;
    }
  }

  const cachedResponse = getCachedAgentResponse(athleteId);
  if (cachedResponse) {
    const cachedData = normalizeWorkoutResponse(cachedResponse, selectedAthlete);
    applyLiveContext(cachedData);
    renderWorkoutCard(cachedData, 'Cached Session Ready');
    setRosterStatus('Cached context loaded', 'warning');
  } else {
    const previewData = fallbackContextForAthlete(selectedAthlete);
    applyLiveContext(previewData);
    setRosterStatus('Loading live session', 'warning');
  }

  await buildSession({ silent: true, trigger: 'selection' });
}

async function loadAthletesForGymSelection() {
  const gymId = gymSelectInput?.value?.trim();
  if (!gymId) {
    loadedAthletes = [];
    setSelectOptions(athleteSelectInput, [], 'Select athlete');
    return;
  }

  try {
    loadedAthletes = await fetchAthletes(currentApiRoot, gymId);
  } catch (error) {
    loadedAthletes = (fallbackAthletesByGym[gymId] || fallbackAthletesByGym['gym-delta-zone'] || []).map(normalizeAthlete);
  }

  setSelectOptions(athleteSelectInput, loadedAthletes, 'Select athlete');
  if (loadedAthletes[0]) {
    athleteSelectInput.value = loadedAthletes[0].id;
  }

  await loadAthleteContextForSelection();
}

async function initializeDynamicRoster() {
  const apiEndpoint = getApiEndpoint();
  currentApiRoot = getApiRoot(apiEndpoint);

  let gyms;
  try {
    gyms = await fetchGyms(currentApiRoot);
  } catch (error) {
    gyms = fallbackGyms;
  }

  setSelectOptions(gymSelectInput, gyms, 'Select gym');
  if (gyms[0]) {
    gymSelectInput.value = gyms[0].id;
  }

  await loadAthletesForGymSelection();
}

function getApiEndpoint() {
  const typedUrl = backendUrlInput?.value?.trim();
  if (typedUrl && /^https?:\/\//i.test(typedUrl)) {
    window.localStorage.setItem(BACKEND_URL_STORAGE_KEY, typedUrl);
    return typedUrl;
  }
  const fallback = resolveVaracisEndpoint();
  if (backendUrlInput && !backendUrlInput.value.trim()) {
    backendUrlInput.value = fallback;
  }
  window.localStorage.setItem(BACKEND_URL_STORAGE_KEY, fallback);
  return fallback;
}

const initialEndpoint = resolveVaracisEndpoint();
if (isProductionHost() && backendUrlField) {
  backendUrlField.hidden = true;
  if (backendUrlInput) {
    backendUrlInput.setAttribute('aria-hidden', 'true');
    backendUrlInput.tabIndex = -1;
  }
}

if (backendUrlInput) {
  backendUrlInput.value = initialEndpoint;
  backendUrlInput.addEventListener('change', async () => {
    const nextUrl = backendUrlInput.value.trim();
    if (nextUrl && /^https?:\/\//i.test(nextUrl)) {
      window.localStorage.setItem(BACKEND_URL_STORAGE_KEY, nextUrl);
      setRosterStatus('Custom backend saved', 'ok');
      await initializeDynamicRoster();
    }
  });
}

if (gymSelectInput) {
  gymSelectInput.addEventListener('change', loadAthletesForGymSelection);
}

if (athleteSelectInput) {
  athleteSelectInput.addEventListener('change', loadAthleteContextForSelection);
}

if (coachNameInput) {
  coachNameInput.addEventListener('change', () => {
    const nextCoach = coachNameInput.value.trim();
    if (nextCoach) {
      setText(coachDisplayEl, `${nextCoach} · Session ready`);
    }
  });
}

if (coachPromptInput) {
  coachPromptInput.addEventListener('input', () => {
    coachPromptDirty = true;
  });
}

if (durationInput) {
  durationInput.addEventListener('change', () => {
    if (currentAthleteContext) {
      buildSession({ silent: true, trigger: 'duration-change' });
    }
  });
}

renderMetricDots();
initializeDynamicRoster();
buildSessionBtn.addEventListener('click', () => buildSession({ silent: false, trigger: 'manual' }));
