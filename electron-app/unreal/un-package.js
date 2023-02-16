const { promises: { readFile } } = require("fs");
const { UPackage: _UPackage } = require("@l2js/core");

class UPackage extends _UPackage {
    async readArrayBuffer() { return (await readFile(this.path)).buffer; }
}

/**
 * @type {UPackage}
 */
let activePackage = null;

module.exports = async function readPackage(path) {
    activePackage = new UPackage(path);
    await activePackage.decode();

    debugger;
}