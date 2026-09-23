import path from 'path';
import cors from 'cors';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import 'colors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import * as rateLimitPackage from 'express-rate-limit';
import authRouter from './features/auth/router.js';
import blogRouter from './features/blog/router.js';
import mediaRouter from './features/media/router.js';
import simulatorRouter from './features/simulator/router.js';
import { errorHandler } from './shared/index.js';

dotenv.config({ path: './config/config.env', quiet: true });
dotenv.config({ quiet: true });
dotenv.config({ path: '../../.env', quiet: true });

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
      'x-content-type-options': ['nosniff'],
    },
  }),
);
app.use(helmet.hidePoweredBy());

// Rate limiting
const limiter = rateLimitMiddleware({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
app.use(limiter);
app.set('trust proxy', 1);

// Enable CORS
app.use(cors());

// Mount routes
app.use('/api/auth', authRouter);
app.use('/media', mediaRouter);
app.use('/api/blog', blogRouter);
app.use('/api/simulator', simulatorRouter);

app.use(errorHandler);

// Serve frontend
app.use(express.static('public'));

// Handle 404 errors
app.use((req: Request, res: Response) => {
  res.status(404).sendFile('404.html', { root: path.join(rootDir, 'public') });
});

app.get(/(.*)/, (req: Request, res: Response) =>
  res.sendFile('index.html', { root: path.join(rootDir, 'public') }),
);

const PORT = Number(process.env.PORT ?? 7001);

const server = process.env.VERCEL
  ? null
  : app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`.yellow),
    );

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
