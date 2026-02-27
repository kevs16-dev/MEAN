const Event = require('../model/event.model');
const { createNotificationForRole } = require('./notification.service');
const User = require('../model/user.model');
const { logActivity } = require('./activity-log.service');

const createEvent = async (eventData, userId) => {
    const event = await Event.create({ ...eventData, createdBy: userId });
    const user = await User.findById(userId).select('role');

    if(event.status === 'PUBLISHED') {
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