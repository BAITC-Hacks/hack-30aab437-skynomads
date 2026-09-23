import { ErrorRequestHandler } from 'express';

interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next): void => {
  const error = err as AppError;

  console.error(`${error.name}: ${error.message}`);

  res.status(error.statusCode ?? 500).json({
    success: false,
    error: error.message || 'Internal server error',
  });
};
