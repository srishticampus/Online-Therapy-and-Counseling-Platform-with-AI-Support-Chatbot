const express = require('express');
const router = express.Router();
const { submitContact, getMessages, updateMessageStatus, deleteMessage } = require('../controllers/contactController');

router.post('/', submitContact); 
router.get('/', getMessages); // Admin
router.put('/:id', updateMessageStatus); // Admin
router.delete('/:id', deleteMessage); // Admin

module.exports = router;