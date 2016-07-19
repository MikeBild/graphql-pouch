const SERVICE_PORT = process.env.PORT || 9999;
const express = require('express');
const fallback = require('express-history-api-fallback');
const browserSync = require('browser-sync');
const app = express();
const rootDir = './public';

app.use(express.static(rootDir));
app.use(fallback('index.html', { root: rootDir }))
app.listen(SERVICE_PORT, () => {
  browserSync({proxy: `localhost:${SERVICE_PORT}`, files: ['public/**/*.{js,css,html}']});
  console.log(`Development server listen on: ${SERVICE_PORT}`)
});