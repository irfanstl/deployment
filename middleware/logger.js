import { Log } from '../backend/models.js';

export const logger = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(body) {
    res.send = originalSend;
    const response = res.send(body);
    
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = req.user?.id || null;
    const suspicious = res.statusCode >= 400 && (req.body?.email?.includes("'") || req.body?.password?.includes("'") || req.path.includes('admin'));
    const reason = suspicious ? 'Potential SQLi or unauthorized access attempt' : null;

    Log.create({
      userId, ip, method: req.method, path: req.path, status: res.statusCode, userAgent, suspicious, reason
    }).catch(err => console.error('Logging error:', err));

    return response;
  };
  next();
};
