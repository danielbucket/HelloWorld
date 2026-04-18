import jwt from 'jsonwebtoken';
import { jwtSecret, jwtExpiration, hostURL, proxyHeader } from '../utils/config.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'missing_token' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'invalid_token' });

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'token_expired' });
    }

    if (!decoded.permissions || !decoded.permissions.includes('read:metrics')) {
      return res.status(403).json({ error: 'insufficient_permissions' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
};

export const issueToken = (req, res) => {
  const origin = req.headers['origin'];
  if (origin !== hostURL) {
    return res.status(403).json({ error: 'invalid_origin' });
  }
  
  const { permissions } = req.body;
  if (!permissions || !permissions.includes('read:metrics')) {
    return res.status(400).json({ error: 'permissions_required' });
  }

  const token = jwt.sign({ permissions }, jwtSecret, { expiresIn: jwtExpiration });
  res.status(200).json({ token });
};

export const checkProxyHeader = (req, res, next) => {
  const proxyHeaderValue = req.headers[proxyHeader];
  if (proxyHeaderValue !== 'true') {
    return res.status(403).json({ error: 'invalid_proxy_header' });
  }
  next();
};