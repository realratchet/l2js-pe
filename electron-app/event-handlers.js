const path = require("path");
const { ipcMain } = require("electron");
const readPackage = require("./unreal/un-package");

const PATH_LINEAGE2 = process.env.PATH_LINEAGE2;


async function onUserInteraction(_, { type, payload } = {}) {
    switch (type) {
        case "read-package": readPackage(path.resolve(PATH_LINEAGE2, payload)); break;
        default: throw new Error(`Unsupported event type: ${type}`);
    }
}

module.exports = function () {
    ipcMain.on("user-interaction", onUserInteraction);
}