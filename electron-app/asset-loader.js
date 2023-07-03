const path = require("path");
const { promises: { readdir } } = require("fs");
const { SUPPORTED_EXTENSIONS } = require("@l2js/core/src/supported-extensions");

module.exports = class AssetLoader extends require("./import-core")().AAssetLoader {
    /**
     * 
     * @param {string} dirClient
     * @returns {Promise<AssetLoader>}
     */
    static async Instantiate(dirClient) {
        const assetList = await collectAssets(dirClient);
        const Library = require("./unreal/un-package");

        return new AssetLoader(dirClient).init(assetList, Library);
    }

    constructor(dirClient) {
        super();
        this.dirClient = dirClient;
    }

    createNativePackage(UNativePackage) { return new UNativePackage(this); }
    createPackage(UPackage, downloadPath) { return new UPackage(this, `${this.dirClient}/${downloadPath}`); }
}

async function* walkSync(dir) {
    const files = await readdir(dir, { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory()) {
            yield* await walkSync(path.join(dir, file.name));
        } else {
            yield path.join(dir, file.name);
        }
    }
}

/**
 * @param {string} dirClient
 * @returns {Promise<import("@l2js/core").IAssetListInfo>}
 */
async function collectAssets(dirClient) {
    const assets = {};

    for await (const fname of walkSync(dirClient)) {

        const ext = path.extname(fname).slice(1).toUpperCase();
        const relPath = fname.replace(dirClient + "/", "");

        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

        assets[relPath.toLowerCase()] = relPath;
    }

    return assets;
}