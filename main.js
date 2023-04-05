"use strict";

const { realpathSync } = require("fs");


(async function () {
    require("dotenv").config();
    // require("source-map-support").install();

    // Import parts of electron to use
    const url = require("url");
    const path = require("path");
    const { spawn, fork, spawnSync } = require("child_process");


    // Keep a global reference of the window object, if you don"t, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    let mainWindow;

    // Keep a reference for dev mode
    let dev = false;

    // Broken:
    // if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
    //   dev = true
    // }

    if (process.env.NODE_ENV !== undefined && process.env.NODE_ENV === "development") {
        dev = true;
    }

    if (process.env.START_WEBPACK !== undefined && process.env.START_WEBPACK === "true") {
        const webpack = require("webpack");
        const WebpackDevServer = require("webpack-dev-server");

        async function startRendererWp() {
            const config = require("./configs/development.config");
            const wp = webpack(config);
            const server = new WebpackDevServer(config.devServer, wp);

            await server.start();
        }

        function startCoreWp() {
            const pathCompile = path.resolve(__dirname, "./compile-core.js");
            const result = spawnSync(process.env.NODE_EXEC_PATH || "node", [`${pathCompile}`], {
                cwd: realpathSync(path.resolve("node_modules/@l2js/core"))
            });

            if (result.status !== 0)
                throw new Error(`'@l2js/core' compilation error.`);

            console.log("'@l2js/core' compilation successfull.");
        }

        startCoreWp(); // NOTE: for whatever reason electron is bitchy when there's a long running forked process, so must be done synchronously, honestly, doesn't matter either way, just triggers my OCD
        await startRendererWp();
    }

    const { app, BrowserWindow } = require("electron");
    // const addEventHandlers = require("./electron-app/event-handlers");
    const addEventHandlers = require("./electron-app/events/ipc-server");

    addEventHandlers();

    function createWindow() {
        // Create the browser window.
        mainWindow = new BrowserWindow({
            width: 1024,
            height: 768,
            show: false,
            webPreferences: {
                preload: path.resolve(app.getAppPath(), "electron-app", "preload.js"),
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        // and load the index.html of the app.
        let indexPath;

        if (dev && process.argv.indexOf("--noDevServer") === -1) {
            indexPath = url.format({
                protocol: "http:",
                host: "localhost:5000",
                pathname: "index.html",
                slashes: true
            });
        } else {
            indexPath = url.format({
                protocol: "file:",
                pathname: path.join(__dirname, "dist", "index.html"),
                slashes: true
            });
        }

        mainWindow.loadURL(indexPath);

        // Don"t show until we are ready and loaded
        mainWindow.once("ready-to-show", () => {

            mainWindow.show();

            // Open the DevTools automatically if developing
            if (dev) {
                const { default: installExtension, REACT_DEVELOPER_TOOLS } = require("electron-devtools-installer");

                installExtension(REACT_DEVELOPER_TOOLS)
                    .catch(err => console.log("Error loading React DevTools: ", err));
                mainWindow.webContents.openDevTools();
            }
        });

        // Emitted when the window is closed.
        mainWindow.on("closed", function () {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
        });
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on("ready", createWindow);

    // Quit when all windows are closed.
    app.on("window-all-closed", () => {
        // On macOS it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== "darwin") {
            app.quit();
        }
    })

    app.on("activate", () => {
        // On macOS it"s common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) {
            createWindow();
        }
    });
})();