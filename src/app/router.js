const router = require('express').Router();
const { GET } = require('./controllers');

router.route('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.route('/', GET.get_system_metrics);

module.exports = router;