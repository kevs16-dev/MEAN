const router = require('express').Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const productController = require('../controller/product.controller');

router.use(authMiddleware, roleMiddleware('BOUTIQUE'));

router.get('/my', productController.getMyProducts);
router.post('/', productController.createProductForMyShop);

router.get('/:id', productController.getMyProductById);
router.put('/:id', productController.updateMyProduct);
router.delete('/:id', productController.deleteMyProduct);

router.get('/:productId/variants', productController.getVariantsForMyProduct);
router.post('/:productId/variants', productController.createVariantForMyProduct);
router.put('/:productId/variants/:variantId', productController.updateVariantForMyProduct);
router.delete('/:productId/variants/:variantId', productController.deleteVariantForMyProduct);

module.exports = router;

