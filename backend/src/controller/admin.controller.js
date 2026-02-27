const googleAnalyticsService = require('../service/google-analytics.service');
const activityLogService = require('../service/activity-log.service');

exports.getBehaviorAnalytics = async (req, res) => {
    try {
        const daysParam = Number(req.query.days);
        const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 30;

        const data = await googleAnalyticsService.getBehaviorReport({ days });

        return res.status(200).json(data);
    } catch (error) {
        console.error('getBehaviorAnalytics error:', error);
        return res.status(500).json({
            message: error.message || 'Erreur lors de la recuperation des données Google Analytics'
        });
    }
};

exports.getUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, actionType } = req.query;

        const result = await activityLogService.getUserActivityForAdmin(userId, {
            page,
            limit,
            actionType
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('getUserActivity error:', error);
        return res.status(error.status || 500).json({
            message: error.message || 'Erreur lors de la recuperation de l’historique utilisateur'
        });
    }
};
