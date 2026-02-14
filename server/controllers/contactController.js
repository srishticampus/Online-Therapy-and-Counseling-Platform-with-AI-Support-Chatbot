const Contact = require('../models/Contact');

// @desc    Submit a contact message (Public)
exports.submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const newContact = await Contact.create({ name, email, subject, message });
        res.status(201).json({ success: true, data: newContact });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get all messages (Admin Only)
exports.getMessages = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const messages = await Contact.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update message status (Admin Only)
exports.updateMessageStatus = async (req, res) => {
    try {
        const message = await Contact.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );
        res.status(200).json({ success: true, data: message });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete message (Admin Only)
exports.deleteMessage = async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};