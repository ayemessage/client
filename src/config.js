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
            algorithm: 'aes256',
            key: 'CHANGEME',
            iv: 'ayeMessageClient',
            encoding: 'utf8',
            keyLength: 32,
            ivLength: 16,
            hashAlgorithm: 'sha512'
        },
        channelTag: {
            socketio: {
                wraps: 256,
                algorithm: 'sha512',
                key: 'CHANGEME',
                iv: 'ayeMessageClient',
                encoding: 'utf8'
            },
            localDiscover: {
                wraps: 128,
                algorithm: 'sha512',
                key: 'CHANGEME',
                iv: 'ayeMessageClient',
                encoding: 'utf8'
            }
        }
    }
}