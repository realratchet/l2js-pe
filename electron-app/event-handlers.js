const path = require("path");
const { ipcMain } = require("electron");
const UPackage = require("./unreal/un-package");
const AssetLoader = require("./asset-loader");

const PATH_LINEAGE2 = process.env.PATH_LINEAGE2;

/**
 * @type {UPackage}
 */
let activePackage = null;

/**
 * @type {AssetLoader}
 */
let assetLoader;

/**
 * 
 * @param {import("electron").IpcMainEvent} sender 
 * @param {*} param1 
 */
async function onUserInteraction(sender, { type, payload } = {}) {
    assetLoader = assetLoader || await AssetLoader.Instantiate(PATH_LINEAGE2);

    switch (type) {
        case "read-package":
            activePackage = await assetLoader.load(assetLoader.getPackage(payload.package, payload.type));
            sender.reply("user-interaction-reply", {
                type,
                payload: activePackage.toJSON()
            });
            break;
        case "load-export":
            sender.reply("user-interaction-reply", {
                type,
                payload: activePackage.fetchObject(payload + 1).loadSelf().toJSON()
            });
            break;
        case "export-package":
            activePackage.toBuffer();
            break;
        default: throw new Error(`Unsupported event type: ${type}`);
    }
}

module.exports = function () {
    ipcMain.on("user-interaction", onUserInteraction);
}