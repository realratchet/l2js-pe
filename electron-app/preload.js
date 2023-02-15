process.once("loaded", () => {
    const { contextBridge, ipcRenderer, shell } = require("electron")

    contextBridge.exposeInMainWorld("electron", {
    });
});