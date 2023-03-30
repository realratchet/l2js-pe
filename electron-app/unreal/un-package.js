const { promises: { readFile, stat, writeFile }, createReadStream, createWriteStream, write } = require("fs");
const { BufferValue, UPackage: _UPackage, UNativePackage: _UNativePackage, UExport, UObject, crypto } = require("../import-core")();
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

        // 193, 131, 42, 158, 123, 0, 25, 0, 1, 0, 0, 0, 217, 19, 0, 0, 64, 0, 0, 0, 98, 16, 0, 0, 247, 201, 85, 0, 43, 2, 0, 0, 19, 181, 85, 0, 177, 97, 251, 216, 49, 117, 226, 77, 188, 72, 207, 47, 1, 113, 136, 57, 1, 0, 0, 0, 98, 16, 0, 0, 217, 19, 0, 0, 5, 78, 111, 110, 101, 0, 16, 4, 7, 4, 7, 86, 101, 99, 116, 111, 114, 0, 16, 4, 7, 4, 6, 105, 76, 101, 97, 102, 0, 16, 0, 7, 0, 11, 90, 111

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
        writer.flush();

        const readable = this.asReadable();

        this.fetchObject(1).loadSelf();

        for (const exp of this.exports) {
            if (exp.isFake) continue;

            if (exp.object) {
                debugger;
            }

            readable.seek(exp.offset, "set");

            const bytes = readable.read(BufferValue.allocBytes(exp.size)).bytes;

            if (writer.size() !== exp.offset) {
                debugger;
            }

            await writer.writeBytes(bytes.buffer);

            if (writer.size() !== (exp.offset + exp.size)) {
                debugger;
            }
        }
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async encrypt(writer) {
        // 5697301
        debugger;

        if (this.version.startsWith("1")) {
            crypto.encoders.encryptModulo(writer.flush(), this.moduloCryptKey);
            // writer.stream.buffer = Buffer.from(encrypted);


            const header = stringToUtf16(`Lineage2Ver${this.version}`);

            writer.stream.chunksStart.push(Buffer.from(header.buffer));
            // writer.stream.chunksStart.push(Buffer.alloc(28));

            const buffer = writer.flush();

            let offset = 0;
            let lineCount = 10;
            let constructedString = "";
            let divisor = 0XF, lineCountHex = 1;

            function read(byteCount) {
                const bytes = buffer.subarray(offset, offset + byteCount);

                offset = offset + byteCount;

                const b = BufferValue.allocBytes(0);
                b.bytes = new DataView(new Uint8Array(bytes).buffer);

                return b;
            }

            const offsetHeader = new Array(5 + lineCountHex).fill("-").join("");

            console.log(`${offsetHeader}--------------------------------------------------------`);
            console.log(`${offsetHeader}------------------- Dumping lines ----------------------`);
            console.log(`${offsetHeader}--------------------------------------------------------`);

            for (let i = 0; i < lineCount; i++) {
                const bytes = Math.min(buffer.byteLength - offset, 8);


                const groups = new Array(bytes).fill('.').map(() => read(2));

                const string1 = groups.map(g => g.hex.slice(2)).join(" ");
                const string2 = groups.map(g => g.string).join("");

                // constructedString += string2;
                // constructedString = constructedString.slice(-100);

                const extraArgs = [];

                let finalString = string1;

                const bits = i.toString(16).toUpperCase();
                const head = new Array(lineCountHex - bits.length).fill("0").join("");

                console.log(
                    [
                        `(0x${head}${bits})`,
                        finalString,
                        string2,
                    ].join(" "),
                    ...extraArgs
                );

            }

            console.log(`${offsetHeader}--------------------------------------------------------`);

            /*
                00000000: 4C00 6900 6E00 6500 6100 6700 6500 3200  L.i.n.e.a.g.e.2.
                00000010: 5600 6500 7200 3100 3100 3100 6D2F 8632  V.e.r.1.1.1.m/.2
                00000020: D7AC B5AC ADAC ACAC 75BF ACAC ECAC ACAC  ........u.......
                00000030: CEBC ACAC 5B65 F9AC 87AE ACAC BF19 F9AC  ....[e..........
            */

            debugger;
        } else {
            debugger;
            throw new Error("Encrypting this version is not yet supported!");
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
            console.assert(this.header.nameOffset === writer.size());
            await this.dumpNameTable(writer);
            await this.dumpExports(writer);
            console.assert(this.header.importOffset === writer.size());
            await this.dumpImportTable(writer);
            console.assert(this.header.exportOffset === writer.size());
            await this.dumpExportTable(writer);

            console.assert(5697273 === writer.size());

            await this.encrypt(writer);

            await writeFile(newPath, writeStream.flush())

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
         * @type {Buffer}
         */
        this.buffer = Buffer.alloc(0);

        /**
         * @type {Buffer[]}
         */
        this.chunks = [];

        /**
         * @type {Buffer[]}
         */
        this.chunksStart = [];
    }

    write(chunk, callback) {
        this.chunks.push(chunk);

        callback();
    }

    flush() {
        if (this.chunksStart.length === 0 && this.chunks.length === 0)
            return this.buffer;

        this.chunksStart.push(this.buffer);
        this.buffer = Buffer.concat(this.chunksStart);
        this.chunksStart.length = 0;

        if (this.chunks.length === 0)
            return this.buffer;

        this.chunks.unshift(this.buffer);
        this.buffer = Buffer.concat(this.chunks);
        this.chunks.length = 0;

        return this.buffer;
    }

    close() { this.flush(); }
    size() {
        const lenStart = this.chunksStart.reduce((acc, v) => acc + v.length, 0);
        const lenEnd = this.chunks.reduce((acc, v) => acc + v.length, 0);

        return lenStart + this.buffer.length + lenEnd;
    }
}

class ByteWriter {
    /**
     * 
     * @param {BufferStream} stream 
     */
    constructor(stream) {
        this.stream = stream;
        this.int64 = new DataView(new ArrayBuffer(8));
        this.int32 = new DataView(new ArrayBuffer(4));
        this.int16 = new DataView(new ArrayBuffer(2));
        this.int8 = new DataView(new ArrayBuffer(1));
    }

    size() { return this.stream.size(); }
    flush() { return this.stream.flush(); }

    /**
     * 
     * @param {ArrayBuffer|string} value 
     */
    writeBytes(value) {
        return new Promise((resolve, reject) => {
            this.stream.write(Buffer.from(value.slice()), error => {
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

function stringToUtf16(str) {
    const buf = new ArrayBuffer(str.length * 2);
    const bufView = new Uint16Array(buf);

    for (let i = 0, len = str.length; i < len; i++)
        bufView[i] = str.charCodeAt(i);


    return bufView;
}