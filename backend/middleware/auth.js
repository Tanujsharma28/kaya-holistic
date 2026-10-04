import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access Denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = verified;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};