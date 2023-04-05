// const path = require("path");
// const { ipcMain } = require("electron");
// const AssetLoader = require("./asset-loader");
// const UPackage = require("./unreal/un-package");
// const { promises: { readdir, stat } } = require("fs");
// const { SUPPORTED_EXTENSIONS } = require("./import-core")();

// const PATH_LINEAGE2 = process.env.PATH_LINEAGE2;

// /**
//  * @type {UPackage}
//  */
// let activePackage = null;

// /**
//  * @type {AssetLoader}
//  */
// let assetLoader;

// /**
//  * 
//  * @param {import("electron").IpcMainEvent} sender 
//  * @param {*} param1 
//  */
// async function onUserInteraction(sender, { type, payload } = {}) {
//     assetLoader = assetLoader || await AssetLoader.Instantiate(PATH_LINEAGE2);

//     switch (type) {
//         case "read-package":
//             activePackage = await assetLoader.load(assetLoader.getPackage(payload.package, payload.type));
//             sender.reply("user-interaction-reply", {
//                 type,
//                 payload: activePackage.toJSON()
//             });
//             break;
//         case "load-export":
//             sender.reply("user-interaction-reply", {
//                 type,
//                 payload: activePackage.fetchObject(payload + 1).loadSelf().toJSON()
//             });
//             break;
//         case "export-package":
//             activePackage.toBuffer();
//             break;
//         case "list-packages":
//             sender.reply("user-interaction-reply", {
//                 type,
//                 payload: await getPackageList(payload)
//             });
//             break;
//         default: throw new Error(`Unsupported event type: ${type}`);
//     }
// }

// module.exports = function () {
//     ipcMain.on("user-interaction", onUserInteraction);
// };

// async function getPackageList(dirname) {
//     const packageList = [];

//     for (const dirAsset of await readdir(dirname)) {
//         const dirAssetFull = path.resolve(dirname, dirAsset);
//         const dirAssetStat = await stat(dirAssetFull);

//         if (!dirAssetStat.isDirectory())
//             continue;

//         for (const fname of await readdir(dirAssetFull)) {
//             const filename = path.resolve(dirAssetFull, fname);
//             const ext = path.extname(filename).slice(1).toUpperCase();

//             if (SUPPORTED_EXTENSIONS.includes(ext)) {
//                 packageList.push(path.join(dirAsset, fname));
//             }
//         }
//     }

//     return packageList;
// }