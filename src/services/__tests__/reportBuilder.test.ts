import {
  buildShareSafeReport,
  buildPrivateReport,
  ShareSafeReport,
  PrivateReport,
  ReportOptions,
} from '../reportBuilder';
import {
  BaselineContext,
  Episode,
  Intervention,
  WeeklyCheckin,
  DayNote,
} from '../../types';

// ── Factories ──────────────────────────────────────────────

function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: 'ep-1',
    title: 'Q1 2026',
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    type: 'intervention',
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeBaseline(overrides: Partial<BaselineContext> = {}): BaselineContext {
  return {
    id: 'bl-1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    sex: 'male',
    age_bracket: '30-39',
    height_bracket_cm: '170-179',
    weight_bracket_kg: '70-79',
    relationship_status: 'single',
    typical_cardio_min_per_week: 150,
    health_notes: 'No known issues',
    routine: [{ name: 'Vitamin D', duration: 'months', regularity: 'daily' }],
    share_defaults: {
      sex: true,
      age_bracket: true,
      height_bracket_cm: true,
      weight_bracket_kg: true,
      relationship_status: false,
      typical_cardio_min_per_week: true,
      health_notes: false,
      routine: true,
    },
    ...overrides,
  };
}

function makeIntervention(overrides: Partial<Intervention> = {}): Intervention {
  return {
    id: 'int-1',
    episode_id: 'ep-1',
    compound: 'nmn',
    dose: 500,
    unit: 'mg',
    route: 'oral',
    form: 'capsule',
    timing: ['morning'],
    with_food: 'yes',
    brand: 'BrandX',
    product: 'NMN Pro',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCheckin(overrides: Partial<WeeklyCheckin> = {}): WeeklyCheckin {
  return {
    id: 'chk-1',
    episode_id: 'ep-1',
    week_start_date: '2026-01-06',
    adherence: { nmn: 'every_day' },
    changes: {},
    events: [],
    confidence: 'sure',
    created_at: '2026-01-06T00:00:00.000Z',
    updated_at: '2026-01-06T00:00:00.000Z',
    ...overrides,
  };
}

function makeDayNote(overrides: Partial<DayNote> = {}): DayNote {
  return {
    id: 'dn-1',
    episode_id: 'ep-1',
    date: '2026-01-15',
    note: 'Felt great today',
    created_at: '2026-01-15T00:00:00.000Z',
    updated_at: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

const defaultOptions: ReportOptions = {
  includeBaseline: true,
  includeDayNotes: true,
  shareOverrides: {},
};

// ── getRelativeDay (tested indirectly via duration_days) ───

describe('getRelativeDay (via buildShareSafeReport)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 17));
  });
  afterEach(() => jest.useRealTimers());

  it('calculates duration_days correctly', () => {
    const ep = makeEpisode({ start_date: '2026-01-01', end_date: '2026-01-31' });
    const report = buildShareSafeReport(null, ep, [], [], [], defaultOptions);
    expect(report.episode.duration_days).toBe(31); // Jan 1–31 inclusive
  });

  it('returns 1 for same-day episode', () => {
    const ep = makeEpisode({ start_date: '2026-03-15', end_date: '2026-03-15' });
    const report = buildShareSafeReport(null, ep, [], [], [], defaultOptions);
    expect(report.episode.duration_days).toBe(1);
  });

  it('handles cross-month episodes', () => {
    const ep = makeEpisode({ start_date: '2026-01-30', end_date: '2026-02-02' });
    const report = buildShareSafeReport(null, ep, [], [], [], defaultOptions);
    expect(report.episode.duration_days).toBe(4); // Jan 30, 31, Feb 1, 2
  });
});

// ── calculateAverageAdherence (tested via adherence_summary) ───

describe('calculateAverageAdherence (via adherence_summary)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 17));
  });
  afterEach(() => jest.useRealTimers());

  const ep = makeEpisode();
  const intervention = makeIntervention();

  it('returns "unknown" when no checkins track the compound', () => {
    const report = buildShareSafeReport(null, ep, [intervention], [], [], defaultOptions);
    expect(report.adherence_summary).toEqual([
      { compound: 'nmn', weeks_tracked: 0, average_adherence: 'unknown' },
    ]);
  });

  it('returns exact value for single checkin', () => {
    const checkin = makeCheckin({ adherence: { nmn: 'most_days' } });
    const report = buildShareSafeReport(null, ep, [intervention], [checkin], [], defaultOptions);
    expect(report.adherence_summary[0].average_adherence).toBe('most_days');
    expect(report.adherence_summary[0].weeks_tracked).toBe(1);
  });

  it('averages multiple checkins and rounds', () => {
    const checkins = [
      makeCheckin({ id: 'c1', adherence: { nmn: 'every_day' } }),  // 5
      makeCheckin({ id: 'c2', adherence: { nmn: 'most_days' } }),  // 4
      makeCheckin({ id: 'c3', adherence: { nmn: 'every_day' } }),  // 5
    ];
    // avg = (5+4+5)/3 = 4.67 → round = 5 → 'every_day'
    const report = buildShareSafeReport(null, ep, [intervention], checkins, [], defaultOptions);
    expect(report.adherence_summary[0].average_adherence).toBe('every_day');
    expect(report.adherence_summary[0].weeks_tracked).toBe(3);
  });

  it('skips checkins that don\'t track the compound', () => {
    const checkins = [
      makeCheckin({ id: 'c1', adherence: { nmn: 'every_day' } }),
      makeCheckin({ id: 'c2', adherence: { tmg: 'most_days' } }), // different compound
    ];
    const report = buildShareSafeReport(null, ep, [intervention], checkins, [], defaultOptions);
    expect(report.adherence_summary[0].weeks_tracked).toBe(1);
    expect(report.adherence_summary[0].average_adherence).toBe('every_day');
  });

  it('handles low adherence values', () => {
    const checkins = [
      makeCheckin({ id: 'c1', adherence: { nmn: 'not_at_all' } }), // 1
      makeCheckin({ id: 'c2', adherence: { nmn: 'rarely' } }),      // 2
    ];
    // avg = 1.5 → round = 2 → 'rarely'
    const report = buildShareSafeReport(null, ep, [intervention], checkins, [], defaultOptions);
    expect(report.adherence_summary[0].average_adherence).toBe('rarely');
  });
});

// ── aggregateChanges (tested via changes_summary) ───

describe('aggregateChanges (via changes_summary)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 17));
  });
  afterEach(() => jest.useRealTimers());

  const ep = makeEpisode();

  it('returns all zeros for empty checkins', () => {
    const report = buildShareSafeReport(null, ep, [], [], [], defaultOptions);
    expect(report.changes_summary).toEqual({
      diet_changes: 0,
      exercise_changes: 0,
      sleep_changes: 0,
      supplement_changes: 0,
      illness_days: 0,
      travel_days: 0,
      stress_periods: 0,
    });
  });

  it('returns all zeros when checkins have no change flags', () => {
    const checkins = [makeCheckin({ changes: {} }), makeCheckin({ id: 'c2', changes: {} })];
    const report = buildShareSafeReport(null, ep, [], checkins, [], defaultOptions);
    expect(report.changes_summary.diet_changes).toBe(0);
  });

  it('counts change flags across multiple checkins', () => {
    const checkins = [
      makeCheckin({ id: 'c1', changes: { diet: true, stress: true } }),
      makeCheckin({ id: 'c2', changes: { diet: true, travel: true } }),
      makeCheckin({ id: 'c3', changes: { illness: true } }),
    ];
    const report = buildShareSafeReport(null, ep, [], checkins, [], defaultOptions);
    expect(report.changes_summary).toEqual({
      diet_changes: 2,
      exercise_changes: 0,
      sleep_changes: 0,
      supplement_changes: 0,
      illness_days: 1,
      travel_days: 1,
      stress_periods: 1,
    });
  });
});

// ── buildShareSafeReport ──────────────────────────────────

describe('buildShareSafeReport', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 17));
  });
  afterEach(() => jest.useRealTimers());

  const ep = makeEpisode();

  it('includes schema_version and generated_at', () => {
    const report = buildShareSafeReport(null, ep, [], [], [], defaultOptions);
    expect(report.schema_version).toBe('0.1.0');
    // generated_at comes from new Date().toISOString(), so use the same expectation
    expect(report.generated_at).toBe(new Date(2026, 2, 17).toISOString());
  });

  it('episode.start_day is always 0', () => {
    const report = buildShareSafeReport(null, ep, [], [], [], defaultOptions);
    expect(report.episode.start_day).toBe(0);
    expect(report.episode.type).toBe('intervention');
  });

  // ── Participant / baseline sharing ──

  it('omits participant when baseline is null', () => {
    const report = buildShareSafeReport(null, ep, [], [], [], defaultOptions);
    expect(report.participant).toBeUndefined();
  });

  it('omits participant when includeBaseline is false', () => {
    const opts: ReportOptions = { ...defaultOptions, includeBaseline: false };
    const report = buildShareSafeReport(makeBaseline(), ep, [], [], [], opts);
    expect(report.participant).toBeUndefined();
  });

  it('includes only fields where share_defaults is true', () => {
    const baseline = makeBaseline({
      share_defaults: {
        sex: true,
        age_bracket: true,
        height_bracket_cm: false,
        weight_bracket_kg: false,
        relationship_status: false,
        typical_cardio_min_per_week: false,
        health_notes: false,
        routine: false,
      },
    });
    const report = buildShareSafeReport(baseline, ep, [], [], [], defaultOptions);
    expect(report.participant).toEqual({
      sex: 'male',
      age_bracket: '30-39',
    });
  });

  it('applies shareOverrides to override baseline defaults', () => {
    const baseline = makeBaseline({
      share_defaults: { sex: true, age_bracket: false },
    });
    const opts: ReportOptions = {
      ...defaultOptions,
      shareOverrides: { age_bracket: true, sex: false },
    };
    const report = buildShareSafeReport(baseline, ep, [], [], [], opts);
    expect(report.participant?.sex).toBeUndefined();
    expect(report.participant?.age_bracket).toBe('30-39');
  });

  it('omits participant if all share fields are false', () => {
    const baseline = makeBaseline({
      share_defaults: {
        sex: false,
        age_bracket: false,
        height_bracket_cm: false,
        weight_bracket_kg: false,
        relationship_status: false,
        typical_cardio_min_per_week: false,
        routine: false,
      },
    });
    const report = buildShareSafeReport(baseline, ep, [], [], [], defaultOptions);
    expect(report.participant).toBeUndefined();
  });

  it('includes routine_summary (count only) when routine is shared', () => {
    const baseline = makeBaseline({
      routine: [
        { name: 'Vitamin D', duration: 'months', regularity: 'daily' },
        { name: 'Fish oil', duration: 'years', regularity: 'daily' },
      ],
      share_defaults: { routine: true },
    });
    const report = buildShareSafeReport(baseline, ep, [], [], [], defaultOptions);
    expect(report.participant?.routine_summary).toBe('2 tracked habits/supplements');
  });

  // ── Interventions ──

  it('strips brand/product from interventions', () => {
    const intervention = makeIntervention({ brand: 'BrandX', product: 'Pro NMN' });
    const report = buildShareSafeReport(null, ep, [intervention], [], [], defaultOptions);
    expect(report.interventions[0]).not.toHaveProperty('brand');
    expect(report.interventions[0]).not.toHaveProperty('product');
    expect(report.interventions[0].compound).toBe('nmn');
    expect(report.interventions[0].dose).toBe(500);
  });

  it('handles no interventions', () => {
    const report = buildShareSafeReport(null, ep, [], [], [], defaultOptions);
    expect(report.interventions).toEqual([]);
    expect(report.adherence_summary).toEqual([]);
  });

  // ── Events & notes counts ──

  it('counts notable events across checkins', () => {
    const checkins = [
      makeCheckin({ id: 'c1', events: ['headache', 'fatigue'] }),
      makeCheckin({ id: 'c2', events: ['fatigue'] }),
    ];
    const report = buildShareSafeReport(null, ep, [], checkins, [], defaultOptions);
    expect(report.notable_events_count).toBe(3);
  });

  it('counts day notes when includeDayNotes is true', () => {
    const notes = [makeDayNote({ id: 'n1' }), makeDayNote({ id: 'n2' })];
    const report = buildShareSafeReport(null, ep, [], [], notes, defaultOptions);
    expect(report.day_notes_count).toBe(2);
  });

  it('returns 0 day_notes_count when includeDayNotes is false', () => {
    const notes = [makeDayNote()];
    const opts: ReportOptions = { ...defaultOptions, includeDayNotes: false };
    const report = buildShareSafeReport(null, ep, [], [], notes, opts);
    expect(report.day_notes_count).toBe(0);
  });
});

// ── buildPrivateReport ────────────────────────────────────

describe('buildPrivateReport', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 17));
  });
  afterEach(() => jest.useRealTimers());

  const ep = makeEpisode();
  const baseline = makeBaseline();
  const intervention = makeIntervention();
  const checkins = [makeCheckin()];
  const notes = [makeDayNote()];

  it('includes all share-safe fields', () => {
    const report = buildPrivateReport(baseline, ep, [intervention], checkins, notes, defaultOptions);
    expect(report.schema_version).toBe('0.1.0');
    expect(report.episode.type).toBe('intervention');
    expect(report.adherence_summary.length).toBe(1);
  });

  it('includes full episode dates', () => {
    const report = buildPrivateReport(baseline, ep, [intervention], checkins, notes, defaultOptions);
    expect(report.episode_dates).toEqual({
      start_date: '2026-01-01',
      end_date: '2026-03-31',
    });
  });

  it('includes full participant baseline', () => {
    const report = buildPrivateReport(baseline, ep, [], [], [], defaultOptions);
    expect(report.full_participant?.sex).toBe('male');
    expect(report.full_participant?.routine).toEqual(baseline.routine);
  });

  it('includes full interventions with brand/product', () => {
    const report = buildPrivateReport(baseline, ep, [intervention], [], [], defaultOptions);
    expect(report.interventions_full[0].brand).toBe('BrandX');
    expect(report.interventions_full[0].product).toBe('NMN Pro');
  });

  it('includes all weekly checkins', () => {
    const report = buildPrivateReport(baseline, ep, [], checkins, notes, defaultOptions);
    expect(report.weekly_checkins).toHaveLength(1);
    expect(report.weekly_checkins[0].id).toBe('chk-1');
  });

  it('includes day notes when includeDayNotes is true', () => {
    const report = buildPrivateReport(baseline, ep, [], [], notes, defaultOptions);
    expect(report.day_notes).toHaveLength(1);
  });

  it('excludes day notes when includeDayNotes is false', () => {
    const opts: ReportOptions = { ...defaultOptions, includeDayNotes: false };
    const report = buildPrivateReport(baseline, ep, [], [], notes, opts);
    expect(report.day_notes).toEqual([]);
  });

  it('includes health_notes from baseline', () => {
    const report = buildPrivateReport(baseline, ep, [], [], [], defaultOptions);
    expect(report.health_notes).toBe('No known issues');
  });

  it('includes special_summary from episode', () => {
    const ep2 = makeEpisode({ special_summary: 'Testing NMN for energy' });
    const report = buildPrivateReport(baseline, ep2, [], [], [], defaultOptions);
    expect(report.special_summary).toBe('Testing NMN for energy');
  });

  it('handles null baseline gracefully', () => {
    const report = buildPrivateReport(null, ep, [], [], [], defaultOptions);
    expect(report.full_participant).toBeUndefined();
    expect(report.health_notes).toBeUndefined();
  });
});
