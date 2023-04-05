const path = require("path");
const { ipcMain } = require("electron");
const ValidChannels = require("./channels");
const AssetLoader = require("../asset-loader");
const { promises: { readdir, stat } } = require("fs");
const { SUPPORTED_EXTENSIONS } = require("../import-core")();

/**
 * @type {AssetLoader}
 */
let assetLoader;

class IPCServer {
    constructor() {
        ValidChannels.forEach(channel => {
            const handlerName = `_on-${channel}`;
            const replyChannel = `${channel}-reply`;

            if (!(handlerName in this))
                throw new Error(`Missing event handler ${handlerName}`);

            ipcMain.on(channel, async (sender, messageId, { type, payload }) => {

                try {
                    sender.reply(replyChannel, messageId, {
                        type,
                        payload: await this[handlerName](type, payload)
                    });
                } catch (ex) {
                    if (!messageId) return; // broadcasting, no exceptions

                    debugger;

                    sender.reply(replyChannel, messageId, {
                        type,
                        error: ex
                    });
                }

            });
        })
    }

    async _onListPackages(payload) {
        assetLoader = await AssetLoader.Instantiate(payload);

        return await getPackageList(payload);
    }

    async _onReadPackage({ name, type, path }) {
        if (!assetLoader) throw new Error(`No asset loader!`);

        let pkg;

        if (path) pkg = assetLoader.getPackage(path);
        else {
            if (!name || !type)
                throw new Error("To find package a path or name and type must be supplied");

            pkg = assetLoader.getPackage(name, type);
        }
        
        await assetLoader.load(pkg);

        return pkg.toJSON();
    }

    async ["_on-user-interaction"](type, payload) {
        switch (type) {
            case "list-packages": return await this._onListPackages(payload);
            case "read-package": return await this._onReadPackage(payload);
            default: throw new Error(`Unsupported event type: ${type}`);
        }
    }
};

function createIPCServer() {
    return new IPCServer();
}

module.exports = createIPCServer;


async function getPackageList(dirname) {
    const packageList = [];

    for (const dirAsset of await readdir(dirname)) {
        const dirAssetFull = path.resolve(dirname, dirAsset);
        const dirAssetStat = await stat(dirAssetFull);

        if (!dirAssetStat.isDirectory())
            continue;

        for (const fname of await readdir(dirAssetFull)) {
            const filename = path.resolve(dirAssetFull, fname);
            const ext = path.extname(filename).slice(1).toUpperCase();

            if (SUPPORTED_EXTENSIONS.includes(ext)) {
                packageList.push(path.join(dirAsset, fname));
            }
        }
    }

    return packageList;
}