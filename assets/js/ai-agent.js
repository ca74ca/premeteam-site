const buildSessionBtn = document.getElementById('buildSessionBtn');
const sessionOutput = document.getElementById('sessionOutput');
const connectionLabel = document.getElementById('connectionLabel');
const connectionDetailLabel = document.getElementById('connectionDetailLabel');
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
      whoopUserId: 'delta-athlete-001',
      name: 'Jordan Athlete',
      coach_name: 'Coach Delta',
      experience_level: 'intermediate',
      primary_goal: 'HYROX performance'
    },
    {
      id: 'delta-athlete-002',
      whoopUserId: 'delta-athlete-002',
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
let sessionData = null;

function setSessionData(nextData) {
  sessionData = nextData;
}

function isProductionHost() {
  return window.location.hostname.includes('deltazonesystem.com');
}

function resolveBackendEndpoint() {
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

function getSelectedWhoopUserId() {
  const selectedAthlete = getSelectedAthlete();
  const member = currentAthleteContext?.member_context || {};
  return (
    selectedAthlete?.whoopUserId ||
    selectedAthlete?.whoop_user_id ||
    selectedAthlete?.member_id ||
    member.whoopUserId ||
    member.whoop_user_id ||
    member.member_id ||
    athletePayload.member_id
  );
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
  const whoopUserId = safeId(
    rawAthlete?.whoopUserId || rawAthlete?.whoop_user_id || rawAthlete?.member_id || rawAthlete?.id,
    athleteId
  );
  return {
    id: athleteId,
    whoopUserId,
    member_id: safeId(rawAthlete?.member_id || rawAthlete?.id || rawAthlete?.athlete_id, athleteId),
    gym_id: safeId(rawAthlete?.gym_id || rawAthlete?.gymId || gymSelectInput?.value, 'delta-zone-systems'),
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

function setText(node, value, emptyFallback = '-') {
  if (!node) return;
  if (value === undefined || value === null || value === '') {
    node.textContent = emptyFallback;
    return;
  }
  node.textContent = String(value);
}

function clipText(value, maxLength = 180) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;
}

function setRosterStatus(label, tone, detail) {
  if (!connectionLabel) return;
  connectionLabel.textContent = label;
  if (connectionDetailLabel) {
    connectionDetailLabel.textContent = detail || 'User ready to build';
  }
  const chip = connectionLabel.closest('.api-chip');
  if (!chip) return;
  chip.style.background = tone === 'warning' ? 'rgba(245,158,11,0.16)' : 'rgba(34,197,94,0.12)';
  chip.style.borderColor = tone === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(96,255,161,0.18)';
}

function historyItemsFromResponse(historyResponse) {
  const payload = unwrapPayload(historyResponse);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.history)) return payload.history;
  if (Array.isArray(payload?.sessions)) return payload.sessions;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function endpointResult(fetchPromise, endpointName) {
  try {
    const response = await fetchPromise;
    if (!response.ok) {
      return {
        ok: false,
        endpoint: endpointName,
        status: response.status,
        data: null,
        error: `${endpointName} ${response.status}`
      };
    }

    const data = await response.json();
    return {
      ok: true,
      endpoint: endpointName,
      status: response.status,
      data,
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      endpoint: endpointName,
      status: 0,
      data: null,
      error: `${endpointName} unavailable`
    };
  }
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

function resetLiveContext(reason = 'Waiting for live data...') {
  setText(athleteSubEl, reason, reason);
  setText(gymLocationValueEl, '-', '-');
  setText(coachDisplayEl, '-', '-');
  setText(wearableValueEl, 'WHOOP data unavailable', 'WHOOP data unavailable');
  setDotState(wearableDotEl, wearableIndicatorTextEl, 'red', 'Unavailable');
  setText(membershipValueEl, '-', '-');
  setDotState(membershipDotEl, membershipIndicatorTextEl, 'amber', 'Pending');
  setText(engagementValueEl, '-', '-');
  setDotState(engagementDotEl, engagementIndicatorTextEl, 'amber', 'Pending');
  setText(sessionsUsedValueEl, 0);
  setText(sessionWindowEl, `${durationInput?.value || 40}m`);
  setText(decisionTextEl, 'Live agent decision unavailable until API data is returned.', 'Live agent decision unavailable until API data is returned.');
  setText(poheNumberEl, 0);
  setText(poheStatusEl, 'Unavailable');

  setText(recoveryValueEl, '0 / 100');
  setText(recoveryLabelEl, 'Unavailable');
  setText(sleepValueEl, '0 hours');
  setText(sleepScoreEl, '0 / 100');
  setText(hrvValueEl, '0 ms');
  setText(hrvScoreEl, '0 / 100');
  setText(goalValueEl, '-');
  setText(lastStrengthValueEl, '-');
  setText(classSessionValueEl, '0 tracked sessions in the current cycle');
  setText(objectiveValueEl, '-');
  setText(whyTodayValueEl, '-');
  setText(modeValueEl, '-');
  setText(constraintValueEl, '-');
  setText(coachNoteValueEl, '-');

  if (recentWorkoutsListEl) {
    recentWorkoutsListEl.innerHTML = '<li>No session history returned by API.</li>';
  }

  const metricBlocks = document.querySelectorAll('.metric-with-dots');
  if (metricBlocks[0]) metricBlocks[0].dataset.score = '0';
  if (metricBlocks[1]) metricBlocks[1].dataset.score = '0';
  if (metricBlocks[2]) metricBlocks[2].dataset.score = '0';
  renderMetricDots();
}

function normalizeWorkoutResponse(result, fallbackAthlete) {
  const payload = unwrapPayload(result) || {};
  const fallbackMember = {
    member_id: fallbackAthlete?.member_id ?? athletePayload.member_id,
    name: fallbackAthlete?.name ?? 'Unknown Athlete',
    coach_name: fallbackAthlete?.coach_name ?? athletePayload.coach_name,
    duration_min: Number(durationInput?.value || athletePayload.duration_min),
    experience_level: fallbackAthlete?.experience_level ?? athletePayload.intake.experience_level,
    primary_goal: fallbackAthlete?.primary_goal ?? '',
    readiness_score: 0,
    pohe_engagement_score: 0,
    engagement_score: 0,
    engagement_focus: 'UNKNOWN',
    member_type: 'Member',
    data_sources_used: [],
    recovery_signals: {
      sleep_hours: 0,
      hrv_score: 0
    },
    previous_lifts: [],
    recent_training_balance: {
      cardio_heavy_sessions_this_week: 0,
      strength_heavy_sessions_this_week: 0
    },
    context_summary: ''
  };
  const fallbackSession = {
    session_focus: '',
    session_intensity: '',
    coach_summary: '',
    session_intent: '',
    constraints_applied: [],
    coach_cues: [],
    delta_zone_notes: [],
    data_insights: {
      readiness_score: 0,
      pohe_engagement_score: 0,
      pohe_verified: false
    },
    coach_prompt_agent: {
      prompt_summary: '',
      assistant_reply: '',
      workout_adjustments: []
    },
    main_workout: [],
    warmup: [],
    cooldown: [],
    analytics: {}
  };
  const fallbackLogic = {
    training_mode: '',
    intensity: '',
    session_objective: '',
    recovery_status: '',
    constraints_applied: []
  };
  const member = payload.member_context || payload.member || payload.athlete || payload.profile || {};
  const session = payload.session_output || payload.session || payload.workout || payload.plan || {};
  const logic = payload.programming_logic || payload.logic || payload.programming || {};
  const recovery = member.recovery_signals || member.recovery || {};

  const athlete = {
    memberId: member.member_id ?? fallbackAthlete?.member_id ?? fallbackMember.member_id,
    name: member.name ?? fallbackAthlete?.name ?? 'Unknown Athlete',
    coachName: member.coach_name ?? fallbackAthlete?.coach_name ?? 'Coach Delta',
    durationMin: member.duration_min ?? payload.duration_min ?? fallbackMember.duration_min ?? 40,
    experienceLevel: member.experience_level ?? fallbackAthlete?.experience_level ?? 'intermediate',
    primaryGoal: member.primary_goal ?? fallbackAthlete?.primary_goal ?? 'General Performance',
    readinessScore: member.readiness_score ?? 0,
    sleepHours: recovery.sleep_hours ?? 0,
    hrvScore: recovery.hrv_score ?? 0,
    poheEngagementScore:
      session?.data_insights?.pohe_engagement_score ??
      member.pohe_engagement_score ??
      0,
    poheVerified: session?.data_insights?.pohe_verified ?? false,
    engagementScore: member.engagement_score ?? 0,
    engagementFocus: member.engagement_focus ?? 'UNKNOWN',
    memberType: member.member_type ?? 'Member',
    dataSourcesUsed: member.data_sources_used ?? [],
    previousLifts: Array.isArray(member.previous_lifts) ? member.previous_lifts : [],
    recentTrainingBalance: member.recent_training_balance ?? {}
  };

  const normalizedSession = {
    focus: session.session_focus ?? '',
    intensity: logic.intensity ?? session.session_intensity ?? 'MODERATE',
    coachSummary: session.coach_summary ?? '',
    sessionIntent: session.session_intent ?? '',
    deliveryTarget: session.delivery_target ?? '',
    trainingMode: logic.training_mode ?? session.training_mode ?? '',
    constraintsApplied: logic.constraints_applied ?? session.constraints_applied ?? [],
    coachCues: session.coach_cues ?? [],
    deltaZoneNotes: session.delta_zone_notes ?? [],
    whyToday: session?.coach_prompt_agent?.prompt_summary ?? '',
    assistantReply: session?.coach_prompt_agent?.assistant_reply ?? '',
    workoutAdjustments: session?.coach_prompt_agent?.workout_adjustments ?? [],
    warmup: session.warmup ?? [],
    mainWorkout: session.main_workout ?? [],
    cooldown: session.cooldown ?? [],
    analytics: session.analytics ?? {}
  };

  return {
    workflow_id: payload.workflow_id || null,
    trigger_status: payload.trigger_status || null,
    booking: payload.booking || null,
    persisted: Boolean(payload.persisted),
    athlete,
    session: normalizedSession,
    member_context: {
      ...fallbackMember,
      ...member,
      member_id: athlete.memberId,
      name: athlete.name,
      coach_name: athlete.coachName,
      duration_min: athlete.durationMin,
      experience_level: athlete.experienceLevel,
      primary_goal: athlete.primaryGoal,
      readiness_score: athlete.readinessScore,
      pohe_engagement_score: athlete.poheEngagementScore,
      engagement_score: athlete.engagementScore,
      engagement_focus: athlete.engagementFocus,
      member_type: athlete.memberType,
      data_sources_used: athlete.dataSourcesUsed,
      recovery_signals: {
        ...fallbackMember.recovery_signals,
        ...recovery,
        sleep_hours: athlete.sleepHours,
        hrv_score: athlete.hrvScore
      },
      previous_lifts: athlete.previousLifts.length ? athlete.previousLifts : fallbackMember.previous_lifts,
      recent_training_balance: {
        ...fallbackMember.recent_training_balance,
        ...athlete.recentTrainingBalance
      }
    },
    session_output: {
      ...fallbackSession,
      ...session,
      session_focus: normalizedSession.focus,
      session_intensity: normalizedSession.intensity,
      coach_summary: normalizedSession.coachSummary,
      session_intent: normalizedSession.sessionIntent,
      delivery_target: normalizedSession.deliveryTarget,
      training_mode: normalizedSession.trainingMode,
      coach_prompt_agent: {
        ...fallbackSession.coach_prompt_agent,
        ...(session.coach_prompt_agent || {}),
        prompt_summary: normalizedSession.whyToday,
        assistant_reply: normalizedSession.assistantReply,
        workout_adjustments: normalizedSession.workoutAdjustments
      },
      data_insights: {
        ...fallbackSession.data_insights,
        ...(session.data_insights || {}),
        pohe_engagement_score: athlete.poheEngagementScore,
        pohe_verified: athlete.poheVerified
      },
      constraints_applied: Array.isArray(normalizedSession.constraintsApplied)
        ? normalizedSession.constraintsApplied
        : fallbackSession.constraints_applied,
      coach_cues: Array.isArray(normalizedSession.coachCues)
        ? normalizedSession.coachCues
        : fallbackSession.coach_cues,
      delta_zone_notes: Array.isArray(normalizedSession.deltaZoneNotes)
        ? normalizedSession.deltaZoneNotes
        : fallbackSession.delta_zone_notes,
      main_workout: Array.isArray(normalizedSession.mainWorkout)
        ? normalizedSession.mainWorkout
        : fallbackSession.main_workout,
      warmup: Array.isArray(normalizedSession.warmup) ? normalizedSession.warmup : [],
      cooldown: Array.isArray(normalizedSession.cooldown) ? normalizedSession.cooldown : [],
      analytics: normalizedSession.analytics
    },
    programming_logic: {
      ...fallbackLogic,
      ...logic,
      training_mode: normalizedSession.trainingMode || fallbackLogic.training_mode,
      intensity: normalizedSession.intensity || fallbackLogic.intensity,
      constraints_applied: Array.isArray(normalizedSession.constraintsApplied)
        ? normalizedSession.constraintsApplied
        : fallbackLogic.constraints_applied
    }
  };
}

function formatSessionCount(member, session) {
  const analyticsCount = Number(session?.analytics?.sessions_used);
  if (!Number.isNaN(analyticsCount) && analyticsCount > 0) return analyticsCount;

  const balance = member?.recent_training_balance || {};
  const derivedCount = Number(balance.cardio_heavy_sessions_this_week || 0) + Number(balance.strength_heavy_sessions_this_week || 0);
  if (derivedCount > 0) return derivedCount;

  return 0;
}

function getWorkoutItems(session, sessionHistory) {
  if (Array.isArray(session?.main_workout) && session.main_workout.length) {
    return session.main_workout
      .flatMap((block) => (block.exercises || []).slice(0, 2).map((exercise) => `${block.block} · ${exercise.name}`))
      .slice(0, 3);
  }

  if (Array.isArray(sessionHistory) && sessionHistory.length) {
    return sessionHistory
      .slice(0, 3)
      .map((item, index) => {
        const title = item?.title || item?.name || item?.session_focus || item?.focus || item?.type || `Session ${index + 1}`;
        const date = item?.date || item?.completed_at || item?.created_at || '';
        return date ? `${title} · ${new Date(date).toLocaleDateString()}` : title;
      });
  }

  return [];
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
  const selectedGym = getSelectedGym();
  const recentWorkoutItems = getWorkoutItems(session, data?.session_history_items || []);
  const engagementScore = Number(member.engagement_score ?? 0);
  const readiness = Number(member.readiness_score ?? 0);
  const sleepHours = Number(recovery.sleep_hours ?? 0);
  const hrvScore = Number(recovery.hrv_score ?? 0);
  const liveWearable = Boolean(data?.whoop_data) || !(member.data_sources_used || []).includes('no_live_wearable');
  const sessionCount = formatSessionCount(member, session);
  const noteSummary = collectCoachNotes(data);
  const engagementLabel = member.engagement_focus || (engagementScore >= 60 ? 'ENGAGED' : 'NEEDS_ATTENTION');

  setText(athleteNameEl, member.name);
  setText(athleteSubEl, `${member.experience_level || '-'} · ${logic.training_mode || '-'}`);
  setText(gymLocationValueEl, `${selectedGym.name} · ${session.delivery_target || member.session_type || 'Personal coaching'}`);
  setText(coachDisplayEl, `${member.coach_name || '-'} · ${logic.training_mode || '-'}`);
  setText(sessionWindowEl, `${member.duration_min || durationInput?.value || athletePayload.duration_min}m`);
  setText(decisionTextEl, clipText(session.coach_summary, 190));
  setText(poheNumberEl, dataInsights.pohe_engagement_score ?? 0);
  setText(poheStatusEl, dataInsights.pohe_verified ? 'Verified / high trust signal' : 'Proxy / live data signal');

  setText(wearableValueEl, liveWearable ? 'Live recovery signal connected' : 'WHOOP data unavailable');
  setDotState(wearableDotEl, wearableIndicatorTextEl, liveWearable ? 'green' : 'red', liveWearable ? 'Live' : 'Unavailable');
  setText(membershipValueEl, member.member_type);
  setDotState(membershipDotEl, membershipIndicatorTextEl, data?.persisted ? 'green' : 'amber', data?.persisted ? 'Active' : 'Synced');
  setText(engagementValueEl, `${engagementLabel.replace(/_/g, ' ').toLowerCase()} · score ${engagementScore || 0}`);
  setDotState(engagementDotEl, engagementIndicatorTextEl, engagementScore >= 60 ? 'green' : (engagementScore >= 30 ? 'amber' : 'red'), engagementScore >= 60 ? 'Engaged' : (engagementScore >= 30 ? 'Watch' : 'Low'));
  setText(sessionsUsedValueEl, sessionCount);

  setText(recoveryValueEl, `${readiness} / 100`);
  setText(recoveryLabelEl, logic.recovery_status || 'Readiness');
  setText(sleepValueEl, `${sleepHours} hours`);
  setText(sleepScoreEl, `${Math.round((Number(sleepHours || 0) / 8.5) * 100)} / 100`);
  setText(hrvValueEl, `${hrvScore} ms`);
  setText(hrvScoreEl, `${hrvScore} / 100`);
  setText(goalValueEl, member.primary_goal);
  setText(lastStrengthValueEl, lifts[0] ? `${lifts[0].name} · ${lifts[0].last_load || '-'} lb x ${lifts[0].last_reps || '-'}` : '-');
  setText(classSessionValueEl, `${sessionCount} tracked sessions in the current cycle`);
  setText(objectiveValueEl, session.session_focus);
  setText(whyTodayValueEl, clipText(promptAgent.prompt_summary, 170));
  setText(modeValueEl, `${logic.training_mode || '-'} · ${session.session_intensity || logic.intensity || '-'}`);
  setText(constraintValueEl, (logic.constraints_applied || [])[0] || '-');
  setText(coachNoteValueEl, clipText(noteSummary[0] || (session.coach_cues || []).slice(0, 2).join(' · ') || 'Focus on RPE. Rest is mandatory.', 150));

  if (recentWorkoutsListEl) {
    recentWorkoutsListEl.innerHTML = recentWorkoutItems.length
      ? recentWorkoutItems.map((item) => `<li>${item}</li>`).join('')
      : '<li>No session history returned by API.</li>';
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

  const warmupItems = Array.isArray(session.warmup)
    ? session.warmup.flatMap((block) => (block.items || []).map((item) => `${block.title}: ${item}`))
    : [];

  const cooldownItems = Array.isArray(session.cooldown)
    ? session.cooldown.flatMap((block) => (block.items || []).map((item) => `${block.title}: ${item}`))
    : [];

  const mainBlocks = Array.isArray(session.main_workout)
    ? session.main_workout
    : [];

  const tags = [
    ...(promptAgent.workout_adjustments || []).slice(0, 3),
    ...(session.constraints_applied || []).slice(0, 2)
  ].slice(0, 5);

  const blockMarkup = mainBlocks.length
    ? `<div class="program-block-grid">${mainBlocks.map((block) => {
      const exercises = (block.exercises || []).map((exercise) => {
        const sets = exercise.sets || exercise.rounds || '-';
        const reps = exercise.reps || exercise.duration || '-';
        const effort = exercise.effort || 'Controlled';
        const note = exercise.note ? `<span class="program-exercise-note">${exercise.note}</span>` : "";
        return `<li><strong>${exercise.name}</strong> · ${sets} sets · ${reps} · ${effort}${note}</li>`;
      }).join("");
      return `<article class="program-block">
        <div class="program-block-title">
          <span>${block.block || 'Main Block'}</span>
          <span>${(block.exercises || []).length} drills</span>
        </div>
        ${block.objective ? `<p class="program-block-objective">${block.objective}</p>` : ""}
        <ul class="tight-list">${exercises}</ul>
      </article>`;
    }).join("")}</div>`
    : `<ul class="tight-list"><li>3 rounds · 500m row</li><li>8 front squats</li><li>10 burpees over erg</li></ul>`;

  applyLiveContext(data);

  sessionOutput.innerHTML = `
    <strong>${sourceLabel}</strong>
    <div class="result-meta-grid">
      <div class="result-meta-item"><small>Mode</small><strong>${logic.training_mode || "-"}</strong></div>
      <div class="result-meta-item"><small>Intensity</small><strong>${session.session_intensity || logic.intensity || "-"}</strong></div>
      <div class="result-meta-item"><small>Objective</small><strong>${session.session_focus || logic.session_objective || 'Hybrid engine and strength development.'}</strong></div>
      <div class="result-meta-item"><small>Why Today</small><strong>${promptAgent.prompt_summary || session.coach_summary || 'Adaptive API returned a session build.'}</strong></div>
    </div>

    <section class="program-section">
      <h4>Main Workout</h4>
      ${blockMarkup}
    </section>

    ${warmupItems.length ? `<section class="program-section"><h4>Warmup</h4><ul class="tight-list">${warmupItems.map((item) => `<li>${item}</li>`).join("")}</ul></section>` : ""}
    ${cooldownItems.length ? `<section class="program-section"><h4>Cooldown</h4><ul class="tight-list">${cooldownItems.map((item) => `<li>${item}</li>`).join("")}</ul></section>` : ""}
    ${notes.length ? `<section class="program-section"><h4>Coach Notes</h4><ul class="tight-list">${notes.map((item) => `<li>${item}</li>`).join("")}</ul></section>` : ""}
    ${tags.length ? `<div class="compact-tags">${tags.map((item) => `<span>${item}</span>`).join("")}</div>` : ""}
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

async function fetchWhoopData(apiRoot, whoopUserId) {
  const encodedWhoopUserId = encodeURIComponent(whoopUserId);
  return fetch(`${apiRoot}/api/whoop-data?whoopUserId=${encodedWhoopUserId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });
}

async function fetchSessionHistory(apiRoot, whoopUserId) {
  const encodedWhoopUserId = encodeURIComponent(whoopUserId);
  return fetch(`${apiRoot}/api/session-history?whoopUserId=${encodedWhoopUserId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });
}

async function fetchAdaptiveSession(apiRoot, whoopUserId) {
  const encodedWhoopUserId = encodeURIComponent(whoopUserId);
  return fetch(`${apiRoot}/api/get-adaptive-session?whoopUserId=${encodedWhoopUserId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });
}

async function buildSession(options = {}) {
  const { silent = false, trigger = 'manual' } = options;
  const selectedAthlete = getSelectedAthlete();
  const payload = buildPayload();
  const athleteId = payload.member_id || athletePayload.member_id;
  const whoopUserId = getSelectedWhoopUserId();
  const apiRoot = currentApiRoot || getApiRoot(getApiEndpoint());
  const requestPayload = {
    gym_id: selectedAthlete?.gym_id || 'delta-zone-systems',
    member_id: selectedAthlete?.member_id || athleteId || 'delta-athlete-001',
    whoopUserId
  };
  const apiEndpoint = `${apiRoot}/api/get-adaptive-session?whoopUserId=${encodeURIComponent(whoopUserId)}`;

  if (!silent) {
    buildSessionBtn.disabled = true;
    buildSessionBtn.textContent = 'Building Live Session...';
    setRosterStatus('Syncing live data', 'warning', 'Loading WHOOP, session, and history...');
    sessionOutput.innerHTML = `<strong>Generating Workout</strong><span>Fetching WHOOP data, session history, and adaptive plan via ${clipText(apiEndpoint, 100)}.</span>`;
  }

  try {
    const [whoopResult, historyResult, adaptiveResult] = await Promise.all([
      endpointResult(fetchWhoopData(apiRoot, whoopUserId), 'whoop-data'),
      endpointResult(fetchSessionHistory(apiRoot, whoopUserId), 'session-history'),
      endpointResult(fetchAdaptiveSession(apiRoot, whoopUserId), 'get-adaptive-session')
    ]);

    if (!adaptiveResult.ok) {
      const adaptiveError = adaptiveResult.error || 'get-adaptive-session unavailable';
      throw new Error(adaptiveError);
    }

    const sourceCount = [whoopResult.ok, historyResult.ok, adaptiveResult.ok].filter(Boolean).length;
    const failures = [whoopResult, historyResult, adaptiveResult]
      .filter((result) => !result.ok)
      .map((result) => result.error)
      .filter(Boolean);

    const rawData = {
      ...(adaptiveResult.data || {}),
      whoop_data: whoopResult.ok ? unwrapPayload(whoopResult.data) : null,
      session_history: historyResult.ok ? unwrapPayload(historyResult.data) : null,
      session_history_items: historyResult.ok ? historyItemsFromResponse(historyResult.data) : [],
      source_status: {
        whoop: whoopResult.ok,
        history: historyResult.ok,
        adaptive: adaptiveResult.ok
      }
    };
    console.log('LIVE RAW DATA', rawData);

    setSessionData(rawData);

    const normalizedData = normalizeWorkoutResponse(rawData, selectedAthlete);
    console.log('NORMALIZED DATA', normalizedData);
    const dataForUi = rawData?.member_context && rawData?.session_output ? rawData : normalizedData;
    persistAgentBundle(athleteId, requestPayload, rawData);
    if (sourceCount === 3) {
      setRosterStatus('Adaptive APIs connected', 'ok', 'WHOOP + session + history synced');
    } else {
      setRosterStatus('Partially synced', 'warning', `Loaded ${sourceCount}/3 sources${failures.length ? ` (${failures.join(', ')})` : ''}`);
    }
    renderWorkoutCard(dataForUi, trigger === 'manual' ? 'Workout Generated' : 'Live Session Synced');
  } catch (error) {
    setRosterStatus('API unavailable', 'warning', error?.message || 'Unable to reach required endpoints');
    resetLiveContext('Live context unavailable');
    if (sessionOutput) {
      sessionOutput.innerHTML = `
        <strong>Unable to load live session</strong>
        <span>Adaptive APIs did not return a valid response for this athlete. Check /api/get-adaptive-session, /api/whoop-data, and /api/session-history for availability and try again.</span>
      `;
    }
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

  setRosterStatus('Syncing live session', 'warning');
  resetLiveContext('Loading live context...');

  if (sessionOutput) {
    sessionOutput.innerHTML = `
      <strong>Syncing Live Session</strong>
      <span>Fetching the latest workout from adaptive APIs. Live data will replace the current view when the request completes.</span>
    `;
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
  const fallback = resolveBackendEndpoint();
  if (backendUrlInput && !backendUrlInput.value.trim()) {
    backendUrlInput.value = fallback;
  }
  window.localStorage.setItem(BACKEND_URL_STORAGE_KEY, fallback);
  return fallback;
}

const initialEndpoint = resolveBackendEndpoint();
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
      setRosterStatus('Custom backend saved', 'ok', 'Reconnecting with new backend URL');
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
  // Force a clean input on every load to avoid stale browser/cache restoration.
  coachPromptInput.value = '';
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
resetLiveContext('Waiting for live data...');
initializeDynamicRoster();
buildSessionBtn.addEventListener('click', () => buildSession({ silent: false, trigger: 'manual' }));
