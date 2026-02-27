const googleAnalyticsService = require('../service/google-analytics.service');
const activityLogService = require('../service/activity-log.service');
const PDFDocument = require('pdfkit');

const buildJsonExport = (user, logs) => {
    const payload = {
        exportedAt: new Date().toISOString(),
        user,
        total: logs.length,
        logs
    };
    return Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
};

const buildPdfExport = (user, logs) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(16).text('Historique d activite utilisateur', { underline: true });
        doc.moveDown();
        doc.fontSize(11).text(`Utilisateur: ${user.prenom || ''} ${user.nom || ''} (${user.email || '-'})`);
        doc.text(`Role: ${user.role || '-'}`);
        doc.text(`Total des activites: ${logs.length}`);
        doc.text(`Date export: ${new Date().toISOString()}`);
        doc.moveDown();

        if (!logs.length) {
            doc.text('Aucune activite recente.');
            doc.end();
            return;
        }

        logs.forEach((log, index) => {
            const date = log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '-';
            const details = log?.metadata?.productName || log?.metadata?.eventTitle || (log.actionType === 'LOGIN_SUCCESS' ? 'Connexion reussie' : '-');
            doc
                .fontSize(10)
                .text(`${index + 1}. [${date}] ${log.actionType} | ${log.entityType} | ${details}`);
        });

        doc.end();
    });
};

const buildAllJsonExport = (logs) => {
    const payload = {
        exportedAt: new Date().toISOString(),
        scope: 'ALL_USERS',
        total: logs.length,
        logs
    };
    return Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
};

const buildAllPdfExport = (logs) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(16).text('Historique d activite - Tous les utilisateurs', { underline: true });
        doc.moveDown();
        doc.fontSize(11).text(`Total des activites: ${logs.length}`);
        doc.text(`Date export: ${new Date().toISOString()}`);
        doc.moveDown();

        if (!logs.length) {
            doc.text('Aucune activite recente.');
            doc.end();
            return;
        }

        logs.forEach((log, index) => {
            const date = log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '-';
            const user = log.userId || {};
            const username = user.username || user.email || 'Utilisateur inconnu';
            const details = log?.metadata?.productName || log?.metadata?.eventTitle || (log.actionType === 'LOGIN_SUCCESS' ? 'Connexion reussie' : '-');
            doc
                .fontSize(10)
                .text(`${index + 1}. [${date}] ${username} | ${log.actionType} | ${log.entityType} | ${details}`);
        });

        doc.end();
    });
};

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

exports.exportUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;
        const format = String(req.query.format || 'json').toLowerCase();
        const deleteAfterExport = String(req.query.deleteAfterExport || 'false').toLowerCase() === 'true';
        const actionType = req.query.actionType;

        if (!['json', 'pdf'].includes(format)) {
            return res.status(400).json({ message: 'Format invalide. Utilisez json ou pdf.' });
        }

        const [user, logs] = await Promise.all([
            activityLogService.getUserIdentityForAdmin(userId),
            activityLogService.getAllUserActivitiesForAdmin(userId, { actionType })
        ]);

        const baseName = `activity-${user.username || user._id}-${Date.now()}`;
        let fileBuffer;
        let contentType;
        let extension;

        if (format === 'pdf') {
            fileBuffer = await buildPdfExport(user, logs);
            contentType = 'application/pdf';
            extension = 'pdf';
        } else {
            fileBuffer = buildJsonExport(user, logs);
            contentType = 'application/json';
            extension = 'json';
        }

        if (deleteAfterExport) {
            await activityLogService.deleteUserActivitiesForAdmin(userId);
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${baseName}.${extension}"`);
        return res.status(200).send(fileBuffer);
    } catch (error) {
        console.error('exportUserActivity error:', error);
        return res.status(error.status || 500).json({
            message: error.message || "Erreur lors de l'export de l'historique"
        });
    }
};

exports.exportAllUsersActivity = async (req, res) => {
    try {
        const format = String(req.query.format || 'json').toLowerCase();
        const deleteAfterExport = String(req.query.deleteAfterExport || 'false').toLowerCase() === 'true';
        const actionType = req.query.actionType;

        if (!['json', 'pdf'].includes(format)) {
            return res.status(400).json({ message: 'Format invalide. Utilisez json ou pdf.' });
        }

        const logs = await activityLogService.getAllActivitiesForAdmin({ actionType });
        const baseName = `activity-all-users-${Date.now()}`;

        let fileBuffer;
        let contentType;
        let extension;

        if (format === 'pdf') {
            fileBuffer = await buildAllPdfExport(logs);
            contentType = 'application/pdf';
            extension = 'pdf';
        } else {
            fileBuffer = buildAllJsonExport(logs);
            contentType = 'application/json';
            extension = 'json';
        }

        if (deleteAfterExport) {
            await activityLogService.deleteAllActivitiesForAdmin();
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${baseName}.${extension}"`);
        return res.status(200).send(fileBuffer);
    } catch (error) {
        console.error('exportAllUsersActivity error:', error);
        return res.status(error.status || 500).json({
            message: error.message || "Erreur lors de l'export global de l'historique"
        });
    }
};
