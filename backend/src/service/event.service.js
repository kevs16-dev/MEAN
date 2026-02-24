const Event = require('../model/event.model');
const { createNotificationForRole } = require('./notification.service');

const createEvent = async (eventData, userId) => {
    const event = await Event.create({ ...eventData, createdBy: userId });

    if(event.status === 'PUBLISHED') {
        await createNotificationForRole(event.targetRoles, {
            title: event.title,
            message: event.description,
            type: 'INFO'
        });
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