// src/routes/notificationRoutes.js
const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificationController');

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(auth);

// GET /api/notifications?limit=50&unreadOnly=1
router.get('/notifications', ah(ctrl.list));

// PATCH /api/notifications/read-all
router.patch('/notifications/read-all', ah(ctrl.markAllRead));

// PATCH /api/notifications/:id/read
router.patch('/notifications/:id/read', (req, res, next) => {
  const id = String(req.params.id || '').trim();
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ success: false, error: 'invalid id' });
  }
  req.params.id = id;
  return ah(ctrl.markRead)(req, res, next);
});

module.exports = router;
