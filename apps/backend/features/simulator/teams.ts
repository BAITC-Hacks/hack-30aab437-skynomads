import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { evaluateScenario, InputError, validateDecisions, type Decision } from './service.js';

interface StoredTeam {
  id: string;
  teamName: string;
  createdAt: string;
  eventId: string | null;
  decisions: Decision[];
}

export const validateTeamName = (input: unknown): string => {
  if (typeof input !== 'string' || !input.trim() || input.trim().length > 60) {
    throw new InputError('Введите название команды от 1 до 60 символов.');
  }
  return input.trim();
};

// A single-process queue + atomic rename prevents lost writes. Store inputs,
// never client scores; derived results are recalculated with the canonical engine.
export const createTeamStore = (file = process.env.TEAM_RESULTS_FILE || resolve('data/team-results.json')) => {
  let queue: Promise<unknown> = Promise.resolve();
  const read = async (): Promise<StoredTeam[]> => {
    try {
      const rows: unknown = JSON.parse(await readFile(file, 'utf8'));
      if (!Array.isArray(rows) || rows.length > 100) throw new Error('Invalid storage');
      return rows.map((row) => {
        if (!row || typeof row !== 'object' || typeof row.id !== 'string' || typeof row.createdAt !== 'string') throw new Error('Invalid record');
        const result = evaluateScenario(row.decisions, row.eventId);
        return { id: row.id, createdAt: row.createdAt, teamName: validateTeamName(row.teamName), eventId: result.event?.id ?? null, decisions: validateDecisions(row.decisions, result.budget) };
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw new Error('Не удалось прочитать результаты команд. Проверьте файл хранилища на сервере.');
    }
  };
  return {
    async list() {
      await queue.catch(() => undefined);
      return (await read()).map((row) => ({ ...row, result: evaluateScenario(row.decisions, row.eventId) }));
    },
    save(input: { teamName?: unknown; decisions?: unknown; eventId?: unknown }) {
      const teamName = validateTeamName(input.teamName);
      const result = evaluateScenario(input.decisions, input.eventId);
      const decisions = validateDecisions(input.decisions, result.budget);
      const record: StoredTeam = { id: randomUUID(), teamName, createdAt: new Date().toISOString(), eventId: result.event?.id ?? null, decisions };
      const task = queue.catch(() => undefined).then(async () => {
        const rows = [...await read(), record].slice(-100);
        const temporary = `${file}.${randomUUID()}.tmp`;
        try {
          await mkdir(dirname(file), { recursive: true });
          await writeFile(temporary, JSON.stringify(rows), { mode: 0o600 });
          await rename(temporary, file);
        } catch {
          throw new Error('Не удалось сохранить результат. Нужен доступный для записи TEAM_RESULTS_FILE на сервере.');
        }
        return { ...record, result };
      });
      queue = task;
      return task;
    },
  };
};
