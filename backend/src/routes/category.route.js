const router = require('express').Router();
const authorize = require('../middleware/authorize.middleware');

const categoryController = require('../controller/category.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/', authMiddleware, authorize('ADMIN'), categoryController.createCategory);
router.get('/', categoryController.getAllCategories);

module.exports = router;