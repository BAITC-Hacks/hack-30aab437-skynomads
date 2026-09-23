import { Router } from 'express';
import { randomInt } from 'node:crypto';
import { explainScenario } from './analysis.js';
import { evaluateScenario, getBaselineScore, getCatalog, InputError } from './service.js';
import { CITY_EVENTS } from './events.js';
import { createTeamStore, validateTeamName } from './teams.js';
import { findImprovement } from './recommendation.js';
import { createPresentation } from './presentation.js';

const router = Router();
let store: ReturnType<typeof createTeamStore> | undefined;
const teamStore = () => store ??= createTeamStore();

const sendError = (res: import('express').Response, error: unknown) => {
  res.status(error instanceof InputError ? 400 : 503).json({ error: error instanceof Error ? error.message : 'Операция недоступна. Попробуйте ещё раз.' });
};

router.get('/events', (_req, res) => { res.json(CITY_EVENTS); });
router.post('/events/draw', (_req, res) => { res.json(CITY_EVENTS[randomInt(CITY_EVENTS.length)]); });
router.get('/teams', async (_req, res) => {
  try { res.set('Cache-Control', 'no-store').json(await teamStore().list()); }
  catch (error) { sendError(res, error); }
});
router.post('/teams', async (req, res) => {
  try { res.status(201).json(await teamStore().save(req.body ?? {})); }
  catch (error) { sendError(res, error); }
});
router.post('/recommendation', async (req, res) => {
  try {
    const suggestion = findImprovement(req.body?.decisions, req.body?.eventId);
    if (!suggestion.candidate) { res.json({ ...suggestion, explanation: null, analysisError: null }); return; }
    try {
      const explanation = await explainScenario(suggestion.candidate.result, suggestion.original);
      res.json({ ...suggestion, explanation, analysisError: null });
    } catch (error) {
      res.json({ ...suggestion, explanation: null, analysisError: (error as Error).message });
    }
  } catch (error) { sendError(res, error); }
});
router.post('/presentation', async (req, res) => {
  try {
    validateTeamName(req.body?.teamName);
    const result = evaluateScenario(req.body?.decisions, req.body?.eventId);
    let analysis: string | null = null;
    try { analysis = await explainScenario(result); } catch { /* Export retains computed facts and marks missing AI. */ }
    const file = await createPresentation(req.body.teamName, req.body.decisions, req.body.eventId, analysis);
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.set('Content-Disposition', 'attachment; filename="akim-team-presentation.pptx"');
    res.set('X-AI-Status', analysis ? 'ok' : 'unavailable');
    res.set('Cache-Control', 'no-store').send(file);
  } catch (error) { sendError(res, error); }
});

router.get('/', (req, res) => {
  try { res.json({ ...getCatalog(req.query.eventId), baselineScore: getBaselineScore(req.query.eventId) }); }
  catch (error) { sendError(res, error); }
});

router.post('/', async (req, res) => {
  try {
    const result = evaluateScenario(req.body?.decisions, req.body?.eventId);
    try {
      const analysis = await explainScenario(result);
      res.json({ ...result, analysis, analysisError: null });
    } catch (error) {
      res.json({ ...result, analysis: null, analysisError: (error as Error).message });
    }
  } catch (error) {
    if (error instanceof InputError) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Не удалось рассчитать сценарий.' });
  }
});

export default router;
