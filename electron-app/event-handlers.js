const { ipcMain } = require("electron");

async function onUserInteraction(_, { type, payload } = {}) {
    debugger;
}

module.exports = function () {
    ipcMain.on("user-interaction", onUserInteraction);
};