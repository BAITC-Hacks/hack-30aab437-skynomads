import { evaluateScenario, getCatalog, InputError, validateDecisions, type Decision, type ScenarioResult } from './service.js';

export const findImprovement = (input: unknown, eventId?: unknown) => {
  const original = evaluateScenario(input, eventId);
  const decisions = validateDecisions(input, original.budget);
  const catalog = getCatalog(eventId);
  let candidate: { decisions: Decision[]; result: ScenarioResult; changedIndex: number } | null = null;
  // Bounded neighborhood: replace one measure or change one target district.
  // Every candidate passes the exact same authoritative validator as user input.
  for (let index = 0; index < decisions.length; index++) {
    for (const measure of catalog.measures) {
      if (decisions.some((decision, i) => i !== index && decision.measureId === measure.id)) continue;
      for (const district of measure.scope === 'Город' ? [null] : catalog.districts.map((item) => item.name)) {
        const changed = decisions.map((decision, i) => i === index ? { measureId: measure.id, district } : { ...decision });
        try {
          const result = evaluateScenario(changed, eventId);
          if (result.score > (candidate?.result.score ?? original.score) + 1e-9) candidate = { decisions: changed, result, changedIndex: index };
        } catch (error) {
          if (!(error instanceof InputError)) throw error;
        }
      }
    }
  }
  return { original, candidate };
};
