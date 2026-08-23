const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({message: 'No authentication token provided'});
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; 
    next();
  }
  catch (err) {
    return res.status(401).json({message: 'Invalid or expired token'});
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({message: 'You do not have permission to perform this action'});
    }
    next();
  };
}

module.exports = {authenticate, authorize};
