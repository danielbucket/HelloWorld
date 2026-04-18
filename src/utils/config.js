const { DEV_MODE } = process.env;

export const jwtSecret = 'your_jwt_secret_key';
export const jwtExpiration = '30d';

export const apiPort = 4040;
export const hostURL = !DEV_MODE ? `https://hello-world.bucketlab.io` : `http://localhost:${apiPort}`;
console.log(`Host URL set to: ${hostURL}`);
export const proxyHeader = 'X-Hello-World-Proxy';