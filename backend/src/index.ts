import apiApp from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
apiApp.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
