const Notification = require('../model/notification.model');

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
    const notificationType = allowedTypes.includes(type) ? type : ' INFO';

    const notification = await Notification.create({
      userId,
      title: title?.trim(),
      message: message.trim(),
      type: notificationType
    });

    res.status(201).json({ success: true, data: notification });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getByUser = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(notifications);
};

exports.patch = async (req, res) => {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true}, { new: true});
    res.json(notification);
};