const { promises: { readFile, stat }, createReadStream, createWriteStream, write } = require("fs");
const { BufferValue, UPackage: _UPackage, UNativePackage: _UNativePackage, UExport, UObject } = require("../import-core")();
const path = require("path");
const { createHash } = require("crypto");
const { Writable } = require("stream");

const chunks = [];

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

        if (this.version.startsWith("1")) await writer.writeUint32(this.signature);
        else {
            debugger;
            throw new Error("Dumping this version is not yet supported!");
        }

        await writer.writeUint32(header.version);
        await writer.writeInt32(header.packageFlags);
        await writer.writeInt32(header.nameCount);              // this will need to be precalced
        await writer.writeInt32(header.nameOffset);             // this will need to be precalced
        await writer.writeInt32(header.exportCount);            // this will need to be precalced
        await writer.writeInt32(header.exportOffset);           // this will need to be precalced
        await writer.writeInt32(header.importCount);            // this will need to be precalced
        await writer.writeInt32(header.importOffset);           // this will need to be precalced

        if (header.getArchiveFileVersion() < 68) {
            await writer.writeUint32(header.heritageCount);
            await writer.writeUint32(header.heritageOffset);
        } else {
            await writer.writeBytes(header.guid.bytes.buffer);
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
        for (const name of this.nameTable) {
            if (name.isFake) continue;

            await writer.writeChar(name.name);
            await writer.writeUint32(name.flags);
        }
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async dumpExportTable(writer) {
        for (const exp of this.exports) {
            5616915
            if (exp.isFake) continue;

            await writer.writeCompat32(exp.idClass);
            await writer.writeCompat32(exp.idSuper);
            await writer.writeUint32(exp.idPackage);
            await writer.writeCompat32(exp.idObjectName);

            await writer.writeUint32(exp.flags);
            await writer.writeCompat32(exp.size);

            if (exp.size > 0)
                await writer.writeCompat32(exp.offset);
        }
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async dumpImportTable(writer) {
        for (const imp of this.imports) {
            if (imp.isFake) continue;

            await writer.writeCompat32(imp.idClassPackage);
            await writer.writeCompat32(imp.idClassName);
            await writer.writeInt32(imp.idPackage);
            await writer.writeCompat32(imp.idObjectName);
        }
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async dumpExports(writer) {
        const readable = this.asReadable();

        for (const exp of this.exports) {
            if (exp.isFake) continue;

            readable.seek(exp.offset, "set");

            const bytes = readable.read(BufferValue.allocBytes(exp.size)).bytes;

            if ((await stat(writer.stream.path)).size !== exp.offset) {
                debugger;
            }

            await writer.writeBytes(bytes.buffer);

            if ((await stat(writer.stream.path)).size !== (exp.offset + exp.size)) {
                debugger;
            }
        }
    }

    async toBuffer() {
        const oldHash = await hashFile(this.path);
        const newPath = this.path + ".new";

        console.log(newPath);

        

        const writeStream = new BufferStream();

        try {
            const writer = new ByteWriter(writeStream);

            // await writer.writeBytes(new ArrayBuffer(28));   // fake the signature for the moment
            await this.dumpHeader(writer);
            await this.dumpNameTable(writer);
            await this.dumpExports(writer);
            await this.dumpImportTable(writer);
            await this.dumpExportTable(writer);
        } finally {
            writeStream.close();
        }

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

class BufferStream extends Writable {
    constructor() {
        super(...arguments);

        /**
         * @type {Buffer[]}
         */
        this.chunks = [];

        /**
         * @type {Buffer}
         */
        this.buffer = null;
    }

    write(chunk, callback) {
        this.chunks.push(chunk);

        callback();
    }

    close() {
        this.buffer = Buffer.concat(this.chunks);
    }
}

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
     * @param {ArrayBuffer|string} value 
     */
    writeBytes(value) {
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
        await this.writeBytes(this.int64.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt64(value) {
        this.int64.setInt64(0, value, true);
        await this.writeBytes(this.int64.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeUint32(value) {
        this.int32.setUint32(0, value, true);
        await this.writeBytes(this.int32.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt32(value) {
        this.int32.setInt32(0, value, true);
        await this.writeBytes(this.int32.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeUint16(value) {
        this.int16.setUint16(0, value, true);
        await this.writeBytes(this.int16.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt16(value) {
        this.int16.setInt16(0, value, true);
        await this.writeBytes(this.int16.buffer);
    }

    /**
     * class BufferStream extends Writable {
            write(chunk) {
                debugger;
            }
        }
     * @param {number} value 
     */
    async writeUint8(value) {
        this.int8.setUint8(0, value, true);
        await this.writeBytes(this.int8.buffer);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt8(value) {
        this.int8.setInt8(0, value, true);
        await this.writeBytes(this.int8.buffer);
    }

    /**
     * 
     * @param {string} value 
     */
    async writeChar(value) {
        await this.writeUint8(value.length + 1);
        await this.writeBytes(value);
        await this.writeUint8(0);
    }

    /**
     * 
     * @param {number} value 
     */
    async writeCompat32(value) { await this.writeBytes(getCompatBytes(value)); }
}

/**
 * 
 * @param {number} value 
 * @returns 
 */
function getCompatBytes(value) {
    const negative = value < 0;
    let bytesLeft = Math.abs(value);

    const bytes = new Uint8Array(sizeOfCompatInt(bytesLeft));

    if (negative) bytes[0] |= 0b10000000;

    bytes[0] |= bytesLeft & 0b00111111;
    bytesLeft = bytesLeft >> 6;

    if (bytesLeft > 0) {
        bytes[0] |= 0b01000000;

        for (let i = 1; i < bytes.length; i++) {
            if (i !== bytes.length - 1)
                bytes[i] |= 0b10000000;

            bytes[i] |= bytesLeft & 0b01111111;

            bytesLeft >>= 7;
        }
    }

    return bytes.buffer;
}

/**
 * 
 * @param {number} value
 * @returns 
 */
function sizeOfCompatInt(value) {
    const absValue = Math.abs(value);

    for (let i = 3, bytes = 5; i >= 0; i--, bytes--) {
        const fit = 1 << (6 + 7 * i);

        if (absValue > fit)
            return bytes;
    }

    return 1;
}