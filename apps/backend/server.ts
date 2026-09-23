import path from 'path';
import { existsSync } from 'node:fs';
import cors from 'cors';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import 'colors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import * as rateLimitPackage from 'express-rate-limit';
import simulatorRouter from './features/simulator/router.js';
import { errorHandler } from './shared/index.js';

dotenv.config({ path: './config/config.env', quiet: true });
dotenv.config({ quiet: true });

const rootDir = process.cwd();

// Create server
const app = express();

type HelmetFactory = typeof import('helmet')['default'];
type RateLimitFactory = typeof import('express-rate-limit')['rateLimit'];

const resolveFactory = (
  moduleNamespace: unknown,
  exportCandidates: string[],
): unknown => {
  if (typeof moduleNamespace === 'function') {
    return moduleNamespace;
  }

  if (typeof moduleNamespace === 'object' && moduleNamespace !== null) {
    const moduleRecord = moduleNamespace as Record<string, unknown>;

    for (const key of exportCandidates) {
      const candidate = moduleRecord[key];

      if (typeof candidate === 'function') {
        return candidate;
      }
    }
  }

  throw new Error('Failed to resolve middleware factory from module export');
};

const helmetMiddleware = resolveFactory(helmet, ['default']) as HelmetFactory;
const rateLimitMiddleware = resolveFactory(rateLimitPackage, ['rateLimit', 'default']) as RateLimitFactory;

// Turn on JSON parser for REST services
app.use(express.json());

// Turn on URL-encoded parser for REST services
app.use(express.urlencoded({ extended: false }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security headers
app.use(helmetMiddleware());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'upgrade-insecure-requests': null,
    },
  }),
);
app.use(helmet.hidePoweredBy());

// Rate limiting
const limiter = rateLimitMiddleware({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
  message: { error: 'Слишком много запросов. Подождите и повторите попытку.' },
});
app.use(limiter);
if (process.env.VERCEL) app.set('trust proxy', 1);

// Enable CORS
app.use(cors());

// Mount routes
app.use('/api/simulator', simulatorRouter);

app.use(errorHandler);

/* Sample boilerplate routes are intentionally not exposed by the MVP. */
app.use(['/api', '/media'], (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Маршрут не найден.' });
});

/* After yarn build, the same origin serves both the SPA and API. */
const frontendBuild = path.resolve(rootDir, '../frontend/build');
if (existsSync(path.join(frontendBuild, 'index.html'))) {
  app.use(express.static(frontendBuild));
  app.get(/.*/, (_req: Request, res: Response) => {
    res.sendFile('index.html', { root: frontendBuild });
  });
}
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Маршрут не найден. Для интерфейса выполните yarn build или yarn start.' });
});

const PORT = Number(process.env.PORT ?? 7000);

const server = process.env.VERCEL
  ? null
  : app.listen(PORT, () =>
      console.log(`Server running on port ${(server?.address() as { port?: number } | null)?.port ?? PORT}`.yellow),
    );
server?.on('error', (error: NodeJS.ErrnoException) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Порт ${PORT} уже занят. Остановите прежний сервер или измените PORT.`
    : 'Не удалось запустить сервер. Проверьте PORT и окружение.');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.log(`Error: ${message}`.red);

  if (server) {
    server.close(() => process.exit(1));
    return;
  }

  process.exit(1);
});

export default app;
