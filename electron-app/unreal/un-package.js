const { promises: { readFile, stat }, createReadStream, createWriteStream, write } = require("fs");
const { BufferValue, UPackage: _UPackage, UNativePackage: _UNativePackage, UExport, UObject } = require("../import-core")();
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

        const writeStream = createWriteStream(newPath, { flags: "w" });

        try {
            const writer = new ByteWriter(writeStream);

            // await writer.writeBytes(new ArrayBuffer(28));   // fake the signature for the moment
            await this.dumpHeader(writer);

            /*
            ---------------------------------------------------------------
            -------------------------- Dumping lines ----------------------
            ---------------------------------------------------------------
            (0x00) C183 2A9E 7B00 1900 0100 0000 D913 0000 Á.*.{.......Ù...
            (0x01) 4000 0000 6210 0000 F7C9 5500 2B02 0000 @...b...÷ÉU.+...
            (0x02) 13B5 5500 B161 FBD8 3175 E24D BC48 CF2F .µU.±aûØ1uâM¼HÏ/
            (0x03) 0171 8839 0100 0000 6210 0000 D913 0000 .q.9....b...Ù...
            (0x04) 054E 6F6E 6500 1004 0704 0756 6563 746F .None......Vecto
            (0x05) 7200 1004 0704 0669 4C65 6166 0010 0007 r......iLeaf....
            (0x06) 000B 5A6F 6E65 4E75 6D62 6572 0010 0007 ..ZoneNumber....
            (0x07) 0005 5A6F 6E65 0010 0007 000C 506F 696E ..Zone......Poin
            (0x08) 7452 6567 696F 6E00 1000 0700 0752 6567 tRegion......Reg
            (0x09) 696F 6E00 1000 0700 094C 6F63 6174 696F ion......Locatio
            (0x0A) 6E00 1000 0700 0643 6F6C 6F72 0010 0407 n......Color....
            (0x0B) 0406 4772 6F75 7000 1000 0700 0852 6F74 ..Group......Rot
            (0x0C) 6174 6F72 0010 0407 040F 6248 6964 6465 ator......bHidde
            (0x0D) 6E45 6447 726F 7570 0010 0007 000C 536F nEdGroup......So
            (0x0E) 756E 6456 6F6C 756D 6500 1000 0700 0C53 undVolume......S
            (0x0F) 6F75 6E64 5261 6469 7573 0010 0007 000D oundRadius......
            (0x10) 416D 6269 656E 7453 6F75 6E64 0010 0007 AmbientSound....
            (0x11) 000E 416D 6269 656E 7452 616E 646F 6D00 ..AmbientRandom.
            (0x12) 1000 0700 1641 6D62 6965 6E74 536F 756E .....AmbientSoun
            (0x13) 6453 7461 7274 5469 6D65 0010 0007 000E dStartTime......
            ---------------------------------------------------------------
            */

            await this.dumpNameTable(writer);
            await this.dumpExports(writer);
            await this.dumpImportTable(writer);
            await this.dumpExportTable(writer);
        } finally {
            writeStream.close();
        }

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
     * 
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