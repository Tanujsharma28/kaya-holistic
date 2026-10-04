import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ success: false, message: "Aapko access nahi hai. Token missing!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid ya expired token." });
  }
};