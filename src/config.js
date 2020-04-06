let home = "~";

if (window.process) home = window.process.env.HOME;

module.exports = {
    url: 'http://10.10.0.22:3001',
    dbName: 'messages',
    checkFrequency: '*/2 * * * * *',
    historyChunkSize: 5000,
    messagesDbConnection: {
        filename: `${home}/Library/Messages/chat.db`,
        mode: 1
    }
}