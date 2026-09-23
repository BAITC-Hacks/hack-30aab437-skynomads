import 'dotenv/config';
import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

/* API routes */

/* Serve frontend */
app.use(express.static('build'));

app.get('{*path}', (_req, res) =>
  res.sendFile('index.html', { root: path.join(__dirname, 'build') })
);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

/* Handle unhandled promise rejections */
process.on('unhandledRejection', (err: any) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;
