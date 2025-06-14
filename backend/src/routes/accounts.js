const express = require('express');
const router = express.Router();
const AccountsController = require('../controllers/AccountsController');

// GET /api/accounts - Get all accounts
router.get('/', AccountsController.getAllAccounts);

// GET /api/accounts/search - Search accounts
router.get('/search', AccountsController.searchAccounts);

// GET /api/accounts/:id/eligibles - Get account eligibles
router.get('/:id/eligibles', AccountsController.getAccountEligibles);

// GET /api/accounts/:id/summary - Get account summary
router.get('/:id/summary', AccountsController.getAccountSummary);

module.exports = router;