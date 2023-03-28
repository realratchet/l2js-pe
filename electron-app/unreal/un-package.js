const { promises: { readFile }, createReadStream, createWriteStream, write } = require("fs");
const { UPackage: _UPackage, UNativePackage: _UNativePackage, UExport, UObject } = require("../import-core")();
const path = require("path");
const { createHash } = require("crypto");

const chunks = [];

const stream = new WritableStream({
    write(chunk) {
        console.log(chunk);
    },
});

async function hashFile(path, algo = "md5") {
    const hashFunc = createHash(algo);   // you can also sha256, sha512 etc
    const contentStream = createReadStream(path);

    await new Promise((resolve, reject) => {
        contentStream.on("data", (data) => hashFunc.update(data));
        contentStream.on("close", resolve);
        contentStream.on("error", reject);
    });

    return hashFunc.digest("hex");       // will return hash, formatted to HEX
}

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

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async dumpHeader(writer) {
        const header = this.header;

        await writer.writeUint32(header.version);
        await writer.writeInt32(header.packageFlags);
        await writer.writeInt32(header.nameCount);
        await writer.writeInt32(header.nameOffset);
        await writer.writeInt32(header.exportCount);
        await writer.writeInt32(header.exportOffset);
        await writer.writeInt32(header.importCount);
        await writer.writeInt32(header.importOffset);

        if (header.getArchiveFileVersion() < 68) {
            await writer.writeUint32(header.heritageCount);
            await writer.writeUint32(header.heritageOffset);
        } else {
            await writer.writeArrayBuffer(header.guid.bytes.buffer);
            await writer.writeInt32(header.generations.length);

            for (const gen of header.generations) {
                await writer.writeUint32(gen.exportCount);
                await writer.writeUint32(gen.nameCount);
            }
        }
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async dumpNameTable(writer) {
        debugger;
    }

    async toBuffer() {
        const oldHash = await hashFile(this.path);
        const newPath = this.path + ".new";

        console.log(newPath);

        const writeStream = createWriteStream(newPath, { flags: "w" });
        const writer = new ByteWriter(writeStream);

        await this.dumpHeader(writer);
        await this.dumpNameTable(writer);

        writeStream.close();

        debugger;

        const newHash = await hashFile(newPath);

        if (oldHash !== newHash) {
            debugger;
            throw new Error("Hash mismatch!");
        }

        debugger;

        throw new Error("Not implemented exception");


    }
}

class UNativePackage extends _UNativePackage {
    isCore = false;
    isEngine = false;
    isNative = true;
}

module.exports = { default: UPackage, UPackage, UNativePackage };

class ByteWriter {
    /**
     * 
     * @param {import("stream").Writable} stream 
     */
    constructor(stream) {
        this.stream = stream;
        this.int64 = new DataView(new ArrayBuffer(8));
        this.int32 = new DataView(new ArrayBuffer(4));
        this.int16 = new DataView(new ArrayBuffer(2));
        this.int8 = new DataView(new ArrayBuffer(1));
    }

    /**
     * 
     * @param {ArrayBuffer} value 
     */
    writeArrayBuffer(value) {
        return new Promise((resolve, reject) => {
            this.stream.write(Buffer.from(value), error => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    }

    /**
     * 
     * @param {number} value 
     */
    async writeUint64(value) {
        this.int64.setUint64(0, value, true);
        await this.writeArrayBuffer(this.int64.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt64(value) {
        this.int64.setInt64(0, value, true);
        await this.writeArrayBuffer(this.int64.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeUint32(value) {
        this.int32.setUint32(0, value, true);
        await this.writeArrayBuffer(this.int32.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt32(value) {
        this.int32.setInt32(0, value, true);
        await this.writeArrayBuffer(this.int32.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeUint16(value) {
        this.int16.setUint16(0, value, true);
        await this.writeArrayBuffer(this.int16.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt16(value) {
        this.int16.setInt16(0, value, true);
        await this.writeArrayBuffer(this.int16.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeUint8(value) {
        this.int8.setUint8(0, value, true);
        await this.writeArrayBuffer(this.int8);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt8(value) {
        this.int8.setInt8(0, value, true);
        await this.writeArrayBuffer(this.int8.buffer);
    }
}