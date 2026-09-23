const path = require('node:path');
const express = require('express');

const app = express();
const buildDirectory = path.resolve(__dirname, 'build');
const port = Number(process.env.PORT ?? 5000);

app.use(express.static(buildDirectory));

app.get(/.*/, (_request, response) => {
  response.sendFile('index.html', { root: buildDirectory });
});

app.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
});
