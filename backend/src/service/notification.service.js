const Notification = require('../model/notification.model');
const User = require('../model/user.model');

const createNotification = async (notificationData) => {
    return await Notification.create(notificationData);
};

const upsertGroupedRegistrationNotification = async ({
    targetUserId,
    eventId,
    eventTitle,
    participantName,
    ticketTypeName
}) => {
    const safeEventTitle = String(eventTitle || 'Evènement privé').trim();
    const safeParticipantName = String(participantName || 'Un client').trim();
    const safeTicketType = String(ticketTypeName || 'Billet').trim();
    const groupKey = `EVENT_REGISTRATION:${String(eventId)}`;

    const existingUnread = await Notification.findOne({
        userId: targetUserId,
        groupKey,
        isRead: false
    });

    if (!existingUnread) {
        return await Notification.create({
            userId: targetUserId,
            groupKey,
            aggregateCount: 1,
            title: `Nouvelle inscription - ${safeEventTitle}`,
            message: `${safeParticipantName} s'est inscrit(e) (${safeTicketType}).`,
            type: 'INFO',
            isRead: false
        });
    }

    const nextCount = Number(existingUnread.aggregateCount || 1) + 1;
    existingUnread.aggregateCount = nextCount;
    existingUnread.title = `${nextCount} nouvelles inscriptions - ${safeEventTitle}`;
    existingUnread.message = `Dernière inscription: ${safeParticipantName} (${safeTicketType}).`;
    existingUnread.type = 'INFO';
    existingUnread.isRead = false;
    return await existingUnread.save();
};

const createNotificationForRole = async (role, notificationData) => {
    const roleList = Array.isArray(role) ? role : [role];
    const userFilter = roleList.includes('ALL') ? {} : { role: { $in: roleList }};
    const users = await User.find(userFilter).select('_id');

    if (!users.length) return [];

    const notifications = users.map(user => ({
        userId: user._id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'INFO',
        isRead: false
    }));

    return await Notification.insertMany(notifications);
};

const getNotificationsByUser = async (userId) => {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
}

const markAsRead = async (notificationId) => {
    return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
}

module.exports = {
    createNotification,
    createNotificationForRole,
    upsertGroupedRegistrationNotification,
    getNotificationsByUser,
    markAsRead
};