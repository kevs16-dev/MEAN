const router = require('express').Router();

const userController = require('../controller/user.controller');
const loginLimiter = require('../config/loginLimiter');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');


router.get('/', authMiddleware, roleMiddleware('ADMIN'), userController.getAllUsers);
router.post('/', authMiddleware, roleMiddleware('ADMIN'), userController.createUserByAdmin);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), userController.updateUserByAdmin);
router.get('/:id', authMiddleware, roleMiddleware('ADMIN'), userController.getUserById);

router.put('/update-profile', authMiddleware, userController.updateProfile);
router.put('/update-password', authMiddleware, userController.updatePassword);

module.exports = router;