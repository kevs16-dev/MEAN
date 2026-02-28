const eventService = require('../service/event.service');
const eventTicketPdfService = require('../service/event-ticket-pdf.service');
const User = require('../model/user.model');

exports.create = async (req, res) => {
    try {
        const event = await eventService.createEvent(req.body, req.user.id);
        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({
            message: err.message || 'Erreur lors de la création de l’évènement'
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        const events = await eventService.getAll();
        res.json(events);
    } catch (err) {
        res.status(500).json({
            message: err.message || 'Erreur lors de la récupération des évènements'
        });
    }
};

exports.getByStatus = async (req, res) => {
    try {
        const { status } = req.query;

        if(!status) {
            return res.status(400).json({
                message: 'Le status est requis'
            });
        }

        const events = await eventService.getEventsByStatus(status);
        res.json(events);
    } catch (err) {
        res.status(500).json({
            message: err.message || 'Erreur lors de la récupération des évènements'
        });
    }
};

exports.getForRole = async (req, res) => {
    try {
        const { role, status } = req.query;

        if(!role) {
            return res.status(400).json({
                message: 'Le rôle est requis'
            });
        }

        const events = await eventService.getEventsForRoleByStatus(role, status, req.user.id);
        res.json(events);
    } catch (err) {
        res.status(500).json({
            message: err.message || 'Erreur lors de la récupération des évènements'
        });
    }
};

exports.registerClient = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { ticketTypeName } = req.body || {};

        const updatedEvent = await eventService.registerClientToPrivateEvent(eventId, req.user.id, ticketTypeName);
        res.json(updatedEvent);
    } catch (err) {
        res.status(400).json({
            message: err.message || "Erreur lors de l'inscription à l’évènement"
        });
    }
};

exports.downloadClientTicket = async (req, res) => {
    try {
        const { eventId } = req.params;
        const [ticketData, user] = await Promise.all([
            eventService.getPrivateEventTicketDataForClient(eventId, req.user.id),
            User.findById(req.user.id).select('nom prenom username email').lean()
        ]);

        const pdfBuffer = await eventTicketPdfService.generateEventTicketPdf({
            event: ticketData.event,
            registration: ticketData.registration,
            ticketNumber: ticketData.ticketNumber,
            ticketCode: ticketData.ticketCode,
            user: user || {}
        });
        const filename = `ticket-evenement-${eventId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(pdfBuffer);
    } catch (err) {
        res.status(400).json({
            message: err.message || "Erreur lors du téléchargement du ticket"
        });
    }
};

exports.getPrivateEventParticipantsForBoutique = async (req, res) => {
    try {
        const { eventId } = req.params;
        const data = await eventService.getPrivateEventParticipantsForBoutique(eventId, req.user.id);
        res.json(data);
    } catch (err) {
        res.status(400).json({
            message: err.message || "Erreur lors de la récupération des participants"
        });
    }
};