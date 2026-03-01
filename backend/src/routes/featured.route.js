const router = require('express').Router();
const featuredController = require('../controller/featured.controller');

router.get('/best-selling-variant', featuredController.getBestSellingVariant);

module.exports = router;
