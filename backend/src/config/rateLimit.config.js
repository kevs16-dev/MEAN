module.exports = {
    login: {
        windowMs: Number(process.env.LOGIN_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: Number(process.env.LOGIN_LIMIT_MAX) || 5
    }
}