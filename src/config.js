let home = "~";

if (window.process) home = window.process.env.HOME;

module.exports = {
    url: 'http://127.0.0.1:3001',
    dbName: 'messages',
    checkFrequency: '*/2 * * * * *',
    historyChunkSize: 5000,
    messagesDbConnection: {
        filename: `${home}/Library/Messages/chat.db`,
        mode: 1
    },
    encryption: {
        data: {
            wraps: 10,
            algorithm: 'aes-256-cbc-hmac-sha1'
        }
    }
}