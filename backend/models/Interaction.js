const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    userQuery: { type: String, required: true },
    botResponse: { type: String, required: true },
    isUnanswered: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interaction', InteractionSchema);