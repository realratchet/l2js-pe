const { promises: { readFile } } = require("fs");
const { UPackage: _UPackage, UNativePackage: _UNativePackage, UExport, UObject } = require("@l2js/core");
const path = require("path");

class UPackage extends _UPackage {
    async readArrayBuffer() { return (await readFile(this.path)).buffer; }

    toJSON() {
        return {
            filename: path.basename(this.path),
            exports: this.exports.map(exp => {
                return {
                    index: exp.index,
                    name: exp.objectName,
                    type: this.getPackageName(exp.idClass)
                };
            })
        };
    }
}

class UNativePackage extends _UNativePackage {
    isCore = false;
    isEngine = false;
    isNative = true;
}

module.exports = { default: UPackage, UPackage, UNativePackage };
