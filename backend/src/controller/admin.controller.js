const googleAnalyticsService = require('../service/google-analytics.service');

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
