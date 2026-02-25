const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const getAnalyticsClient = () => {
    const clientEmail = process.env.GA4_CLIENT_EMAIL;
    const privateKey = process.env.GA4_PRIVATE_KEY;

    if (clientEmail && privateKey) {
        return new BetaAnalyticsDataClient({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey.replace(/\\n/g, '\n')
            }
        });
    }

    return new BetaAnalyticsDataClient();
};

const validatePropertyId = () => {
    const propertyId = (process.env.GA4_PROPERTY_ID || '').trim();

    if (!propertyId) {
        throw new Error('GA4_PROPERTY_ID est manquant dans le fichier .env');
    }

    if (!/^\d+$/.test(propertyId)) {
        throw new Error('GA4_PROPERTY_ID doit etre l identifiant numerique de la propriete GA4');
    }

    return propertyId;
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const buildDateRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (days - 1));

    const formatDate = (date) => date.toISOString().split('T')[0];

    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    };
};

const getBehaviorReport = async ({ days = 30 } = {}) => {
    const propertyId = validatePropertyId();
    const client = getAnalyticsClient();
    const dateRange = buildDateRange(days);
    const property = `properties/${propertyId}`;

    const [overviewRes, pagesRes, devicesRes, sourcesRes, trendRes] = await Promise.all([
        client.runReport({
            property,
            dateRanges: [dateRange],
            metrics: [
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'sessions' },
                { name: 'engagementRate' },
                { name: 'averageSessionDuration' },
                { name: 'eventCount' },
                { name: 'screenPageViews' },
                { name: 'bounceRate' }
            ]
        }),
        client.runReport({
            property,
            dateRanges: [dateRange],
            dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 10
        }),
        client.runReport({
            property,
            dateRanges: [dateRange],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
        }),
        client.runReport({
            property,
            dateRanges: [dateRange],
            dimensions: [{ name: 'sessionSourceMedium' }],
            metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 10
        }),
        client.runReport({
            property,
            dateRanges: [dateRange],
            dimensions: [{ name: 'date' }],
            metrics: [{ name: 'activeUsers' }, { name: 'newUsers' }, { name: 'sessions' }],
            orderBys: [{ dimension: { dimensionName: 'date' } }]
        })
    ]);

    const [overviewData] = overviewRes;
    const [pagesData] = pagesRes;
    const [devicesData] = devicesRes;
    const [sourcesData] = sourcesRes;
    const [trendData] = trendRes;

    const metrics = overviewData.rows?.[0]?.metricValues || [];

    return {
        period: {
            days,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
        },
        overview: {
            activeUsers: toNumber(metrics[0]?.value),
            newUsers: toNumber(metrics[1]?.value),
            sessions: toNumber(metrics[2]?.value),
            engagementRate: toNumber(metrics[3]?.value),
            averageSessionDuration: toNumber(metrics[4]?.value),
            eventCount: toNumber(metrics[5]?.value),
            screenPageViews: toNumber(metrics[6]?.value),
            bounceRate: toNumber(metrics[7]?.value)
        },
        topPages: (pagesData.rows || []).map((row) => ({
            pagePath: row.dimensionValues?.[0]?.value || '(not set)',
            pageTitle: row.dimensionValues?.[1]?.value || '(sans titre)',
            screenPageViews: toNumber(row.metricValues?.[0]?.value),
            activeUsers: toNumber(row.metricValues?.[1]?.value)
        })),
        deviceBreakdown: (devicesData.rows || []).map((row) => ({
            deviceCategory: row.dimensionValues?.[0]?.value || '(not set)',
            activeUsers: toNumber(row.metricValues?.[0]?.value)
        })),
        trafficSources: (sourcesData.rows || []).map((row) => ({
            sourceMedium: row.dimensionValues?.[0]?.value || '(not set)',
            sessions: toNumber(row.metricValues?.[0]?.value),
            activeUsers: toNumber(row.metricValues?.[1]?.value)
        })),
        dailyTrend: (trendData.rows || []).map((row) => ({
            date: row.dimensionValues?.[0]?.value || '',
            activeUsers: toNumber(row.metricValues?.[0]?.value),
            newUsers: toNumber(row.metricValues?.[1]?.value),
            sessions: toNumber(row.metricValues?.[2]?.value)
        }))
    };
};

module.exports = {
    getBehaviorReport
};
