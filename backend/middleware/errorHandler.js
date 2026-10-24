// Express 4 async handlers ke errors ko errorHandler tak pahunchata hai (warna server crash ho sakta hai)
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('❌', err.message);
    if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Request body too large' });
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    success: false,
    message: status >= 500 && isProd ? 'Something went wrong. Please try again.' : err.message || 'Internal server error',
  });
};