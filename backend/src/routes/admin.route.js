const router = require('express').Router();

const adminController = require('../controller/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.get('/analytics/behavior', authMiddleware, roleMiddleware('ADMIN'), adminController.getBehaviorAnalytics);
router.get('/users/:userId/activity', authMiddleware, roleMiddleware('ADMIN'), adminController.getUserActivity);
router.get('/users/:userId/activity/export', authMiddleware, roleMiddleware('ADMIN'), adminController.exportUserActivity);
router.get('/users/activity/export-all', authMiddleware, roleMiddleware('ADMIN'), adminController.exportAllUsersActivity);

module.exports = router;
