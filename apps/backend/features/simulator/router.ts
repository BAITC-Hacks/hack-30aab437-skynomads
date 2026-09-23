import { Router } from 'express';
import { explainScenario } from './analysis.js';
import { evaluateScenario, getBaselineScore, getCatalog, InputError } from './service.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ ...getCatalog(), baselineScore: getBaselineScore() });
});

router.post('/', async (req, res) => {
  try {
    const result = evaluateScenario(req.body?.decisions);
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
