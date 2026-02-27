const Event = require('../model/event.model');
const { createNotificationForRole } = require('./notification.service');
const User = require('../model/user.model');
const { logActivity } = require('./activity-log.service');

const createEvent = async (eventData, userId) => {
    const { createNotification = true, ...eventPayload } = eventData || {};
    const now = new Date();
    const startDate = new Date(eventPayload?.startDate);
    const endDate = new Date(eventPayload?.endDate);
    const reminderDaysBefore = Number(eventPayload?.reminderDaysBefore ?? 0);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new Error('Les dates de début et de fin sont obligatoires.');
    }

    if (startDate < now) {
        throw new Error('La date de début doit être postérieure ou égale à la date actuelle.');
    }

    if (endDate < startDate) {
        throw new Error('La date de fin doit être postérieure à la date de début.');
    }

    if (!Number.isInteger(reminderDaysBefore) || reminderDaysBefore < 0) {
        throw new Error('Le rappel doit être un nombre de jours positif ou nul.');
    }

    const event = await Event.create({
        ...eventPayload,
        startDate,
        endDate,
        reminderDaysBefore,
        createdBy: userId
    });
    const user = await User.findById(userId).select('role');

    if(event.status === 'PUBLISHED' && createNotification) {
        await createNotificationForRole(event.targetRoles, {
            title: event.title,
            message: event.description,
            type: 'INFO'
        });
    }

    try {
        await logActivity({
            userId,
            actorRole: user?.role || 'ADMIN',
            actionType: 'EVENT_CREATED',
            entityType: 'EVENT',
            entityId: event._id,
            metadata: {
                eventTitle: event.title,
                status: event.status
            }
        });
    } catch (error) {
        console.error('log EVENT_CREATED error:', error);
    }

    return event;
};

const getAll = async () => {
    return await Event.find();
}

const getEventsByStatus = async (status) => {
    return await Event.find({
        status: status
    }).sort({ startDate : 1 });
};

const getEventsForRoleByStatus = async (role, status) => {
    const query = {
        $or: [
        { targetRoles: 'ALL' },
        { targetRoles: role }
        ]
    };

    if (status) {
        query.status = status;
    }

    return await Event.find(query).sort({ startDate: 1 });
};

module.exports = {
    createEvent,
    getAll,
    getEventsByStatus,
    getEventsForRoleByStatus
}