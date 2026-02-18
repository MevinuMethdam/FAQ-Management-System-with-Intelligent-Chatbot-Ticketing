const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    studentQuery: { type: String, required: true },
    adminReply: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);