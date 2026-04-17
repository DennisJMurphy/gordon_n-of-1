// Phase 5: Test async orchestrator functions in reportBuilder
// Mocks repositories (not raw DB) per spec

import { generateReports, generateAndSaveReports } from '../reportBuilder';

// Mock all repository imports
jest.mock('../../db/repositories/baselineContext');
jest.mock('../../db/repositories/episodes');
jest.mock('../../db/repositories/interventions');
jest.mock('../../db/repositories/weeklyCheckins');
jest.mock('../../db/repositories/dayNotes');
jest.mock('../../db/repositories/reports');

import { getBaselineContext } from '../../db/repositories/baselineContext';
import { getEpisodeById } from '../../db/repositories/episodes';
import { getInterventionsByEpisode } from '../../db/repositories/interventions';
import { getCheckinsByEpisode } from '../../db/repositories/weeklyCheckins';
import { getNotesByEpisode } from '../../db/repositories/dayNotes';
import { createReport } from '../../db/repositories/reports';

const mockGetBaselineContext = getBaselineContext as jest.MockedFunction<typeof getBaselineContext>;
const mockGetEpisodeById = getEpisodeById as jest.MockedFunction<typeof getEpisodeById>;
const mockGetInterventionsByEpisode = getInterventionsByEpisode as jest.MockedFunction<typeof getInterventionsByEpisode>;
const mockGetCheckinsByEpisode = getCheckinsByEpisode as jest.MockedFunction<typeof getCheckinsByEpisode>;
const mockGetNotesByEpisode = getNotesByEpisode as jest.MockedFunction<typeof getNotesByEpisode>;
const mockCreateReport = createReport as jest.MockedFunction<typeof createReport>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
});

afterEach(() => jest.useRealTimers());

const episode = {
  id: 'ep-1',
  title: 'Q1 2026',
  start_date: '2026-01-01',
  end_date: '2026-03-31',
  type: 'intervention' as const,
  status: 'active' as const,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const options = {
  includeBaseline: true,
  includeDayNotes: true,
  shareOverrides: {},
};

function setupMocks() {
  mockGetBaselineContext.mockResolvedValue(null);
  mockGetEpisodeById.mockResolvedValue(episode);
  mockGetInterventionsByEpisode.mockResolvedValue([]);
  mockGetCheckinsByEpisode.mockResolvedValue([]);
  mockGetNotesByEpisode.mockResolvedValue([]);
}

// ── generateReports ─────────────────────────────────────

describe('generateReports', () => {
  it('loads data from all repositories and returns both report types', async () => {
    setupMocks();

    const result = await generateReports('ep-1', options);

    expect(mockGetBaselineContext).toHaveBeenCalledTimes(1);
    expect(mockGetEpisodeById).toHaveBeenCalledWith('ep-1');
    expect(mockGetInterventionsByEpisode).toHaveBeenCalledWith('ep-1');
    expect(mockGetCheckinsByEpisode).toHaveBeenCalledWith('ep-1');
    expect(mockGetNotesByEpisode).toHaveBeenCalledWith('ep-1');

    expect(result.shareSafe).toBeDefined();
    expect(result.shareSafe.schema_version).toBe('0.2.0');
    expect(result.private).toBeDefined();
    expect(result.private.episode_dates).toEqual({
      start_date: '2026-01-01',
      end_date: '2026-03-31',
    });
  });

  it('throws when episode not found', async () => {
    mockGetBaselineContext.mockResolvedValue(null);
    mockGetEpisodeById.mockResolvedValue(null);
    mockGetInterventionsByEpisode.mockResolvedValue([]);
    mockGetCheckinsByEpisode.mockResolvedValue([]);
    mockGetNotesByEpisode.mockResolvedValue([]);

    await expect(generateReports('missing', options)).rejects.toThrow('Episode not found');
  });

  it('passes loaded data through to builders correctly', async () => {
    const baseline = {
      id: 'bl-1',
      created_at: '',
      updated_at: '',
      sex: 'male' as const,
      age_bracket: '30-39',
      routine: [],
      share_defaults: { sex: true },
    };
    mockGetBaselineContext.mockResolvedValue(baseline);
    mockGetEpisodeById.mockResolvedValue(episode);
    mockGetInterventionsByEpisode.mockResolvedValue([{
      id: 'int-1',
      episode_id: 'ep-1',
      compound: 'nmn',
      timing: ['morning'],
      created_at: '',
      updated_at: '',
    }]);
    mockGetCheckinsByEpisode.mockResolvedValue([]);
    mockGetNotesByEpisode.mockResolvedValue([]);

    const result = await generateReports('ep-1', options);

    // Share-safe should have participant with sex (shared)
    expect(result.shareSafe.participant?.sex).toBe('male');
    // Share-safe should have intervention without brand
    expect(result.shareSafe.interventions).toHaveLength(1);
    expect(result.shareSafe.interventions[0].compound).toBe('nmn');
    // Private should have full baseline
    expect(result.private.full_participant?.sex).toBe('male');
  });
});

// ── generateAndSaveReports ──────────────────────────────

describe('generateAndSaveReports', () => {
  it('generates reports and saves via createReport, returns report id', async () => {
    setupMocks();
    mockCreateReport.mockResolvedValue({
      id: 'rpt-1',
      episode_id: 'ep-1',
      schema_version: '0.2.0',
      generated_at: '2026-03-15T12:00:00.000Z',
      report_json: '{}',
      private_json: '{}',
    });

    const reportId = await generateAndSaveReports('ep-1', options);

    expect(reportId).toBe('rpt-1');
    expect(mockCreateReport).toHaveBeenCalledTimes(1);

    const createArg = mockCreateReport.mock.calls[0][0];
    expect(createArg.episode_id).toBe('ep-1');
    expect(createArg.schema_version).toBe('0.2.0');
    expect(JSON.parse(createArg.report_json)).toHaveProperty('schema_version', '0.2.0');
    expect(JSON.parse(createArg.private_json!)).toHaveProperty('episode_dates');
  });
});
