module.exports = {
    url: 'http://localhost:3001',
    dbName: 'messages',
    checkFrequency: '*/2 * * * * *',
    historyChunkSize: 5000,
    messagesDbConnection: {
        filename: `${process.env.HOME}/Library/Messages/chat.db`,
        mode: 1
    }
}