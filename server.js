import app from './app.js';
import { process } from 'process';

const API_PORT = parseInt(process.env.API_PORT || '8000', 10);
const API_HOST = process.env.API_HOST || '0.0.0.0';

const server = () => app.listen(API_PORT, API_HOST, () => {
  console.log(`metrics api listening on ${API_HOST}:${API_PORT}`);
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