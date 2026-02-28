const router = require('express').Router();

const eventController = require('../controller/event.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.post('/', authMiddleware, roleMiddleware('ADMIN', 'BOUTIQUE'), eventController.create);
router.get('/', authMiddleware, eventController.getAll);
router.get('/status', authMiddleware, eventController.getByStatus);
router.get('/role/', authMiddleware, eventController.getForRole);
router.post('/:eventId/register', authMiddleware, roleMiddleware('CLIENT'), eventController.registerClient);
router.get('/:eventId/ticket', authMiddleware, roleMiddleware('CLIENT'), eventController.downloadClientTicket);
router.get('/:eventId/participants', authMiddleware, roleMiddleware('BOUTIQUE'), eventController.getPrivateEventParticipantsForBoutique);

module.exports = router;