const { promises: { readFile } } = require("fs");
const { UPackage: _UPackage, UExport, UObject } = require("@l2js/core");
const path = require("path");

module.exports = class UPackage extends _UPackage {
    constructor(path) {
        super(path);

        this.loaded = new Map();
    }

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

    static async loadPackage(path) { return await (new UPackage(path)).decode(); }

    /**
     * 
     * @param {UExport} */
    loadExport(exp) {
        const obj = new UObject();

        obj.load(this.asReadable(), exp);

        debugger;
    }

    fetchExport(index) {
        const exp = this.exports[index];

        if (!this.loaded.has(exp))
            this.loaded.set(exp, this.loadExport(exp));

        return this.loaded.get(exp).toJSON();
    }
}

