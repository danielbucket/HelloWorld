import app from './src/app.js';
import { apiPort } from './src/utils/config.js';
const port = parseInt(apiPort, 10);

const server = () => app.listen(port, () => {
  console.log(`Metrics API listening on port ${port}`);
});

// process.argv[1] is the path to the script being executed, so this condition checks if server.js is being run directly rather than imported as a module
if (import.meta.url === `file://${process.argv[1]}`) {
  server();
} else {
  console.warn('server.js is being imported as a module, not starting server');
}

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server().close(() => {
    console.log('Server closed, exiting process.');
    process.exit(0);
  });
});