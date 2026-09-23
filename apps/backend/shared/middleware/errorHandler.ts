import { ErrorRequestHandler } from 'express';

interface AppError extends Error {
  statusCode?: number;
  status?: number;
  type?: string;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next): void => {
  const error = err as AppError;

  const status = error.statusCode ?? error.status ?? 500;
  let message = 'Внутренняя ошибка сервера. Попробуйте позже.';
  if (error.type === 'entity.parse.failed') message = 'Некорректный JSON в запросе.';
  else if (status === 413) message = 'Слишком большой запрос.';
  else if (status >= 400 && status < 500) message = 'Некорректный запрос.';
  if (status >= 500) console.error('Request failed:', error.name);
  res.status(status >= 400 && status <= 599 ? status : 500).json({
    success: false,
    error: message,
  });
};
