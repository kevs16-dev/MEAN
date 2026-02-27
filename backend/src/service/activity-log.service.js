const ActivityLog = require('../model/activityLog.model');
const User = require('../model/user.model');
const AppError = require('../utils/AppError');

const ALLOWED_ACTION_TYPES = ['PRODUCT_CREATED', 'PRODUCT_UPDATED', 'EVENT_CREATED', 'LOGIN_SUCCESS'];

const logActivity = async ({
  userId,
  actorRole,
  actionType,
  entityType,
  entityId,
  metadata = {}
}) => {
  if (!userId || !actionType || !entityType || !entityId || !actorRole) {
    return null;
  }

  return ActivityLog.create({
    userId,
    actorRole,
    actionType,
    entityType,
    entityId,
    metadata
  });
};

const getUserActivityForAdmin = async (userId, options = {}) => {
  const user = await User.findById(userId).select('_id username nom prenom email role');
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 404);
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = { userId };
  if (options.actionType && ALLOWED_ACTION_TYPES.includes(options.actionType)) {
    query.actionType = options.actionType;
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments(query)
  ]);

  return {
    user,
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

const getUserIdentityForAdmin = async (userId) => {
  const user = await User.findById(userId).select('_id username nom prenom email role');
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 404);
  }
  return user;
};

const getAllUserActivitiesForAdmin = async (userId, options = {}) => {
  await getUserIdentityForAdmin(userId);

  const query = { userId };
  if (options.actionType && ALLOWED_ACTION_TYPES.includes(options.actionType)) {
    query.actionType = options.actionType;
  }

  return ActivityLog.find(query).sort({ createdAt: -1 }).lean();
};

const deleteUserActivitiesForAdmin = async (userId) => {
  await getUserIdentityForAdmin(userId);
  const result = await ActivityLog.deleteMany({ userId });
  return result.deletedCount || 0;
};

const getAllActivitiesForAdmin = async (options = {}) => {
  const query = {};
  if (options.actionType && ALLOWED_ACTION_TYPES.includes(options.actionType)) {
    query.actionType = options.actionType;
  }

  return ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', '_id username nom prenom email role')
    .lean();
};

const deleteAllActivitiesForAdmin = async () => {
  const result = await ActivityLog.deleteMany({});
  return result.deletedCount || 0;
};

const getMyActivity = async (userId, options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const query = { userId };
  if (options.actionType && ALLOWED_ACTION_TYPES.includes(options.actionType)) {
    query.actionType = options.actionType;
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments(query)
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

module.exports = {
  logActivity,
  getUserActivityForAdmin,
  getMyActivity,
  getUserIdentityForAdmin,
  getAllUserActivitiesForAdmin,
  deleteUserActivitiesForAdmin,
  getAllActivitiesForAdmin,
  deleteAllActivitiesForAdmin
};
