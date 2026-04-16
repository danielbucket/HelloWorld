const jwt = require('jsonwebtoken');
const { jwtSecret, originURL } = require('../../auth/config.js');

exports.verifyToken = (req, res, next) => {
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

exports.issueToken = (req, res) => {
  const origin = req.headers['origin'];
  if (origin !== originURL) {
    return res.status(403).json({ error: 'invalid_origin' });
  }
  
  const { permissions } = req.body;
  if (!permissions || !permissions.includes('read:metrics')) {
    return res.status(400).json({ error: 'permissions_required' });
  }

  const token = jwt.sign({ permissions }, jwtSecret, { expiresIn: '30d' });
  res.status(200).json({ token });
};