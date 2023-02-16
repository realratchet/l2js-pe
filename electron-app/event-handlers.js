const path = require("path");
const { ipcMain } = require("electron");
const UPackage = require("./unreal/un-package");

const PATH_LINEAGE2 = process.env.PATH_LINEAGE2;

/**
 * @type {UPackage}
 */
let activePackage = null;

/**
 * 
 * @param {import("electron").IpcMainEvent} sender 
 * @param {*} param1 
 */
async function onUserInteraction(sender, { type, payload } = {}) {
    switch (type) {
        case "read-package":
            activePackage = await UPackage.loadPackage(path.resolve(PATH_LINEAGE2, payload));
            sender.reply("user-interaction-reply", {
                type,
                payload: activePackage.toJSON()
            });
            break;
        case "load-export":
            activePackage.fetchExport(payload);
            break;
        default: throw new Error(`Unsupported event type: ${type}`);
    }
}

module.exports = function () {
    ipcMain.on("user-interaction", onUserInteraction);
}