module.exports = function importCore() {
    try {
        /**
         * @type {import("@l2js/core")}
         */
        const _export = process.env.START_WEBPACK !== undefined && process.env.START_WEBPACK === "true"
            ? require("../l2js-core/index.local")
            : require("@l2js/core");

        return _export;
    } catch (e) {
        console.log(e);
        return require("@l2js/core");
    }
}