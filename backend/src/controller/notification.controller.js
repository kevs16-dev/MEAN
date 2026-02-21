const notificationService = require('../service/notification.service');

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, message, type } = req.body;

    if (!message) {
      return res.status(400).json({
        message: 'Le champ "message" est obligatoire'
      });
    }

    const allowedTypes = ['INFO', 'SUCCESS', 'WARNING', 'ALERT', 'ERROR'];
    const notificationType = allowedTypes.includes(type) ? type : 'INFO';

    const notification = await notificationService.createNotification({ userId, title, message, type: notificationType});

    res.status(201).json({ success: true, data: notification });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createForRole = async (req, res) => {
  try {
    const { role, title, message, type } = req.body;
    if (!role || !message) {
      return res.status(400).json({
        message: 'Les champs "role" et "message" sont obligatoires'
      });
    }
    const allowedTypes = ['INFO', 'SUCCESS', 'WARNING', 'ALERT', 'ERROR'];
    const notificationType = allowedTypes.includes(type) ? type : 'INFO';
    const notifications = await notificationService.createNotificationForRole(role, { title, message, type: notificationType });
    res.status(201).json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getByUser = async (req, res) => {
  const notifications = await notificationService.getNotificationsByUser(req.user.id);
  res.json(notifications);
};

exports.patch = async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json(notification);
};