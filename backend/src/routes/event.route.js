const router = require('express').Router();

const eventController = require('../controller/event.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.post('/', authMiddleware, roleMiddleware('ADMIN', 'BOUTIQUE'), eventController.create);
router.get('/', authMiddleware, eventController.getAll);
router.get('/status', authMiddleware, eventController.getByStatus);
router.get('/role/', authMiddleware, eventController.getForRole);

module.exports = router;