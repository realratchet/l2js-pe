const path = require("path");
const { ipcMain } = require("electron");
const ValidChannels = require("./channels");
const AssetLoader = require("../asset-loader");
const { promises: { readdir, stat } } = require("fs");
// const { SUPPORTED_EXTENSIONS } = require("../import-core")();
const SUPPORTED_EXTENSIONS = ["UNR"];

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

                    console.log(ex);

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

    async _onFetchExport({ index, name, type, path, ext }) {
        if (!assetLoader) throw new Error(`No asset loader!`);

        let pkg;

        if (path) pkg = assetLoader.getPackage(path);
        else {
            if (!name || (!type && !ext))
                throw new Error("To find package a path or name and type must be supplied");

            pkg = ext
                ? assetLoader.packages.get(name).get(ext)
                : assetLoader.getPackage(name, type);
        }

        await assetLoader.load(pkg);

        const object = pkg.fetchObject(index).loadSelf();

        return object.toJSON();
    }

    async _onUpdateProperty({ object, propertyName, propertyIndex, propertyValue }) {
        const propChain = [];

        let parent = object;

        let filename;

        while (parent) {
            switch (parent.type) {
                case "struct":
                    break;
                case "object":
                    filename = object.filename;
                    propChain.p
                    parent = null;
                    break;
                default: throw new Error(`Invalid type: ${parent.type}`);
            }
        }


        console.log(arguments[0]);

        if (!assetLoader) throw new Error(`No asset loader!`);

        const pkg = assetLoader.getPackage(filename);

        if (!pkg.isDecoded())
            throw new Error("Cannot set property for package that was never decoded? How did this happen?");

        if (!isFinite(index) || index < 0 || index >= pkg.exports.length) throw new Error(`Invalid export index: ${index}`);

        const exp = pkg.exports[index];

        if (exp.isFake)
            throw new Error("Cannot modify fake exports!");

        if (!exp.object)
            throw new Error("Object isn't loaded yet!");

        const object = exp.object;

        if (!object.propertyDict.has(propertyName))
            throw new Error(`'${propertyName}' is not a valid property!`);

        const prop = object.propertyDict.get(propertyName);

        if (propertyIndex < 0 || propertyIndex >= prop.propertyValue.length)
            throw new Error(`Index '${propertyIndex}' is out of bounds.`);

        const propVal = prop.propertyValue[propertyIndex];

        console.log(propVal, "->", propertyValue);
    }

    async _onSavePackage({ index, name, type, path, ext }) {
        if (!assetLoader) throw new Error(`No asset loader!`);

        let pkg;

        if (path) pkg = assetLoader.getPackage(path);
        else {
            if (!name || (!type && !ext))
                throw new Error("To find package a path or name and type must be supplied");

            pkg = ext
                ? assetLoader.packages.get(name).get(ext)
                : assetLoader.getPackage(name, type);
        }

        if (!pkg.isDecoded())
            throw new Error("Cannot set property for package that was never decoded? How did this happen?");

        await pkg.savePackage();
    }

    async ["_on-user-interaction"](type, payload) {
        switch (type) {
            case "list-packages": return await this._onListPackages(payload);
            case "read-package": return await this._onReadPackage(payload);
            case "fetch-export": return await this._onFetchExport(payload);
            case "update-property": return await this._onUpdateProperty(payload);
            case "save-package": return await this._onSavePackage(payload);
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

    return packageList.filter(x => x.includes("17_25"));
}