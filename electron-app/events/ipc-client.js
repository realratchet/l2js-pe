const { v4: uuid } = require("uuid");
const { ipcRenderer } = require("electron");
const ValidChannels = require("./channels");

const trackedMessages = new Map();

const IPCClient = new class IPCClient {
    async send(channel, payload, broadcast = false) {

        if (!channel) throw new Error("Must specify a channel");
        if (!ValidChannels.includes(channel)) throw new Error(`Unsupported channel: ${channel}`);

        const messageId = broadcast ? undefined : uuid();
        const replyChannelType = `${channel}-reply`;

        if (!trackedMessages.has(replyChannelType)) {
            trackedMessages.set(replyChannelType, new Map());

            const replyChannel = trackedMessages.get(replyChannelType);

            ipcRenderer.on(replyChannelType, (_, messageId, payload) => {
                if (!messageId) return;
                if (!replyChannel.has(messageId))
                    throw new Error(`Received unknown message: ${messageId}`);

                const [resolve, reject] = replyChannel.get(messageId);

                replyChannel.delete(messageId);

                if ("error" in payload) {
                    reject(payload.error);
                    return;
                }

                resolve(payload.payload);
            });
        }

        ipcRenderer.send(channel, messageId, payload);

        if (!broadcast) {
            const replyChannel = trackedMessages.get(replyChannelType);

            return new Promise((resolve, reject) => {
                replyChannel.set(messageId, [resolve, reject]);
            });
        }

        return Promise.reject(new Error("Broadcasts do not return anything."));
    }
};

module.exports = IPCClient;

