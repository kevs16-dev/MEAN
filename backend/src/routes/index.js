const router = require('express').Router();

router.use('/test', require('./test.route'));

module.exports = router;
