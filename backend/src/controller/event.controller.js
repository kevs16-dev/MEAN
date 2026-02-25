const eventService = require('../service/event.service');

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

        const events = await eventService.getEventsForRoleByStatus(role, status);
        res.json(events);
    } catch (err) {
        res.status(500).json({
            message: err.message || 'Erreur lors de la récupération des évènements'
        });
    }
};