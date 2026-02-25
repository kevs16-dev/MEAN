const router = require('express').Router();

const adminController = require('../controller/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.get('/analytics/behavior', authMiddleware, roleMiddleware('ADMIN'), adminController.getBehaviorAnalytics);

module.exports = router;
