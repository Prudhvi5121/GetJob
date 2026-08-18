import apiApp from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
apiApp.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on http://0.0.0.0:${PORT}`);
});
