const Notification = require('../model/notification.model');
const User = require('../model/user.model');

const createNotification = async (notificationData) => {
    return await Notification.create(notificationData);
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
    getNotificationsByUser,
    markAsRead
};