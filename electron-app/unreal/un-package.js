const { promises: { readFile, stat, writeFile }, createReadStream, createWriteStream, write } = require("fs");
const { BufferValue, UPackage: _UPackage, UNativePackage: _UNativePackage, UExport, UObject, UnProperties, UNP_PropertyTypes, UNP_PropertyMasks, UNP_DataTypeSizes, crypto, UnArrays } = require("../import-core")();
const path = require("path");
const { createHash } = require("crypto");
const { Writable } = require("stream");

UObject.UNREAD_AS_NATIVE = true;

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
    async padHeader(writer) {
        let headerSize = 0;

        const header = this.header;

        if (this.version.startsWith("1")) headerSize += 4;
        else {
            debugger;
            throw new Error("Dumping this version is not yet supported!");
        }

        headerSize += 4; //header.version
        headerSize += 4; //header.packageFlags
        headerSize += 4; //header.nameCount
        headerSize += 4; //header.nameOffset
        headerSize += 4; //header.exportCount
        headerSize += 4; //header.exportOffset
        headerSize += 4; //header.importCount
        headerSize += 4; //header.importOffset

        if (header.getArchiveFileVersion() < 68) {
            headerSize += 4; // header.heritageCount
            headerSize += 4; // header.heritageOffset
        } else {
            headerSize += 16; // header.guid;
            headerSize += 4;  // header.generations.length

            for (const gen of header.generations) {
                headerSize += 4; // gen.exportCount
                headerSize += 4; // gen.nameCount
            }
        }

        await writer.writeBytes(new ArrayBuffer(headerSize));
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async dumpHeader(writer, [nameTableOffset, nameCount], [exportTableOffset, exportCount], [importTableOffset, importCount]) {
        writer.flush();

        const gen = this.header.generations[0];

        console.assert(gen.nameCount === nameCount);
        console.assert(gen.exportCount === exportCount);

        console.assert(this.header.nameOffset === nameTableOffset);
        console.assert(this.header.nameCount === nameCount);

        console.assert(this.header.exportOffset === exportTableOffset);
        console.assert(this.header.exportCount === exportCount);

        console.assert(this.header.importOffset === importTableOffset);
        console.assert(this.header.importCount === importCount);


        const header = this.header;

        writer.stream.seek(0);

        if (this.version.startsWith("1")) await writer.setUint32(this.signature);
        else {
            debugger;
            throw new Error("Dumping this version is not yet supported!");
        }

        await writer.setUint32(header.version);
        await writer.setInt32(header.packageFlags);
        await writer.setInt32(nameCount);              // this will need to be precalced
        await writer.setInt32(nameTableOffset);             // this will need to be precalced
        await writer.setInt32(exportCount);            // this will need to be precalced
        await writer.setInt32(exportTableOffset);           // this will need to be precalced
        await writer.setInt32(importCount);            // this will need to be precalced
        await writer.setInt32(importTableOffset);           // this will need to be precalced

        if (header.getArchiveFileVersion() < 68) {
            throw new Error("Not yet implemented");
            await writer.setUint32(header.heritageCount);
            await writer.setUint32(header.heritageOffset);
        } else {
            await writer.setBytes(header.guid.bytes.buffer);
            await writer.setInt32(header.generations.length);

            for (const gen of header.generations) {
                await writer.setUint32(gen.exportCount);
                await writer.setUint32(gen.nameCount);
            }
        }

        writer.stream.seek(undefined);
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async dumpNameTable(writer) {
        let nameCount = 0;

        for (const name of this.nameTable) {
            if (name.isFake) continue;

            await writer.writeChar(name.name);
            await writer.writeUint32(name.flags);

            nameCount++;
        }

        return nameCount;
    }

    /**
     * 
     * @param {ByteWriter} writer 
     * @param {number} exportTableOffset
     * @param {number[]} exportSizes
     */
    async dumpExportTable(writer, exportTableOffset, exportSizes) {

        let expOffset = exportTableOffset;

        for (let i = 0, len = this.exports.length, j = 0; i < len; i++) {
            const exp = this.exports[i];

            if (exp.isFake) continue;

            const exportSize = exportSizes[i];

            console.assert(exp.size === exportSize);

            await writer.writeCompat32(exp.idClass);
            await writer.writeCompat32(exp.idSuper);
            await writer.writeUint32(exp.idPackage);
            await writer.writeCompat32(exp.idObjectName);

            await writer.writeUint32(exp.flags);
            await writer.writeCompat32(exportSize);

            if (exp.size > 0) {
                console.assert(expOffset === exp.offset);
                await writer.writeCompat32(expOffset);
            }

            expOffset = expOffset + exportSize;

            j++;
        }
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async dumpImportTable(writer) {
        let importCount = 0;

        for (const imp of this.imports) {
            if (imp.isFake) continue;

            await writer.writeCompat32(imp.idClassPackage);
            await writer.writeCompat32(imp.idClassName);
            await writer.writeInt32(imp.idPackage);
            await writer.writeCompat32(imp.idObjectName);

            importCount++;
        }

        return importCount;
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async dumpExports(writer) {
        writer.flush();

        const readable = this.asReadable();
        const exportSizes = [];

        // this.fetchObject(1).loadSelf();
        // this.fetchObject(3131);

        for (const exp of this.exports) {
            if (exp.isFake) continue;

            if (exp.object?.loadSelf()) {
                const serialized = serializeObject(this.nameHash, exp.object);

                if (serialized.byteLength !== exp.size) {
                    debugger;
                    throw new Error("Re-serialization mismatch");
                }

                await writer.writeBytes(serialized);
                exportSizes.push(serialized.byteLength);
            } else {

                readable.seek(exp.offset, "set");

                const bytes = readable.read(BufferValue.allocBytes(exp.size)).bytes;

                if (writer.size() !== exp.offset) {
                    debugger;
                }

                await writer.writeBytes(bytes.buffer);
                exportSizes.push(bytes.buffer.byteLength);
            }

            if (writer.size() !== (exp.offset + exp.size)) {
                debugger;
            }
        }

        return exportSizes;
    }

    /**
     * 
     * @param {ByteWriter} writer 
     */
    async encrypt(writer) {
        if (this.version.startsWith("1")) {
            crypto.encoders.encryptModulo(writer.flush(), this.moduloCryptKey);

            const header = stringToUtf16(`Lineage2Ver${this.version}`);

            writer.stream.chunksStart.push(Buffer.from(header.buffer));

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
        } else {
            debugger;
            throw new Error("Encrypting this version is not yet supported!");
        }
    }

    async toBuffer() {
        const writeStream = new BufferStream();

        try {
            const writer = new ByteWriter(writeStream);

            await this.padHeader(writer); // we fake the header first until a seek/overwrite is added

            console.assert(this.header.nameOffset === writer.size());
            console.assert(this.header.generations !== 1);


            const nameTableOffset = writeStream.size();
            const nameCount = await this.dumpNameTable(writer);

            const exportOffset = writeStream.size();
            const exportSizes = await this.dumpExports(writer);
            const exportCount = exportSizes.length;
            console.assert(this.header.importOffset === writer.size());

            const importTableOffset = writeStream.size();
            const importCount = await this.dumpImportTable(writer);
            console.assert(this.header.exportOffset === writer.size());

            const exportTableOffset = writeStream.size();
            await this.dumpExportTable(writer, exportOffset, exportSizes);
            await this.dumpHeader(
                writer,
                [nameTableOffset, nameCount],
                [exportTableOffset, exportCount],
                [importTableOffset, importCount]
            );


            console.assert(5697273 === writer.size());

            const pkgString = await this.readPackageString();

            await this.encrypt(writer);

            writeStream.flush();

            return writeStream;
        } finally {
            writeStream.close();
        }

    }

    async savePackage() {
        const writeStream = (await this.toBuffer()).buffer;
        const newPath = this.path + ".new";

        await writeFile(newPath, writeStream);
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

        this.position = undefined;
    }

    write(chunk, callback) {
        this.position = undefined;

        this.chunks.push(chunk);

        callback();
    }

    set(chunk, callback) {
        this.flush();

        const chSize = chunk.byteLength || chunk.length || 0;

        if (this.position === undefined) throw new Error("Cannot set at the end");

        this.buffer.set(chunk, this.position);
        this.position = this.position + chSize;

        callback();
    }

    seek(position) { this.position = position; }
    tell() { return this.position === undefined ? this.size() : this.position; }

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
        this.endianess = "little";
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
     * @param {ArrayBuffer|string} value 
     */
    setBytes(value) {
        return new Promise((resolve, reject) => {
            this.stream.set(Buffer.from(value.slice()), error => {
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
    async writeUint64(value) { await this.writeBytes(this.getUint64(value)); }
    async setUint64(value) { await this.setBytes(this.getUint64(value)); }
    getUint64(value, copy = false) {
        this.int64.setUint64(0, value, this.endianess === "little");
        return copy ? this.int64.buffer.slice() : this.int64.buffer;
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt64(value) { await this.writeBytes(this.getInt64(value)); }
    async setInt64(value) { await this.setBytes(this.getInt64(value)); }
    getInt64(value, copy = false) {
        this.int64.setInt64(0, value, this.endianess === "little");
        return copy ? this.int64.buffer.slice() : this.int64.buffer;
    }

    /**
     * 
     * @param {number} value 
     */
    async writeUint32(value) { await this.writeBytes(this.getUint32(value)); }
    async setUint32(value) { await this.setBytes(this.getUint32(value)); }
    getUint32(value, copy = false) {
        this.int32.setUint32(0, value, this.endianess === "little");
        return copy ? this.int32.buffer.slice() : this.int32.buffer;
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt32(value) { await this.writeBytes(this.getInt32(value)); }
    async setInt32(value) { await this.setBytes(this.getInt32(value)); }
    getInt32(value, copy = false) {
        this.int32.setInt32(0, value, this.endianess === "little");
        return copy ? this.int32.buffer.slice() : this.int32.buffer;
    }

    /**
     * 
     * @param {number} value 
     */
    async writeUint16(value) { await this.writeBytes(this.getnt16(value)); }
    async setUint16(value) { await this.setBytes(this.getnt16(value)); }
    getUint16(value, copy = false) {
        this.int16.setUint16(0, value, this.endianess === "little");
        return copy ? this.int16.buffer.slice() : this.int16.buffer;
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt16(value) { await this.writeBytes(this.getInt16(value)); }
    async setInt16(value) { await this.setBytes(this.getInt16(value)); }
    getInt16(value, copy = false) {
        this.int16.setInt16(0, value, this.endianess === "little");
        return copy ? this.int16.buffer.slice() : this.int16.buffer;
    }

    /**
     * 
     * @param {number} value 
     */
    async writeUint8(value) { await this.writeBytes(this.getUint8(value)); }
    async setUint8(value) { await this.setBytes(this.getUint8(value)); }
    getUint8(value, copy = false) {
        this.int8.setUint8(0, value, this.endianess === "little");
        return copy ? this.int8.buffer.slice() : this.int8.buffer;
    }

    /**
     * 
     * @param {number} value 
     */
    async writeInt8(value) { await this.writeBytes(this.getInt8(value)); }
    async setInt8(value) { await this.setBytes(this.getInt8(value)); }
    geteInt8(value, copy = false) {
        this.int8.setInt8(0, value, this.endianess === "little");
        return copy ? this.int8.buffer.slice() : this.int8.buffer;
    }

    /**
     * 
     * @param {string} value 
     */
    async writeChar(value) { await this.writeBytes(this.getChar(value)); }
    async setChar(value) { await this.setBytes(this.getChar(value)); }
    getChar(value) { return getStrBytes(value); }

    /**
     * 
     * @param {number} value 
     */
    async writeCompat32(value) { await this.writeBytes(this.getCompat32(value)); }
    async setCompat32(value) { await this.setBytes(this.getCompat32(value)); }
    getCompat32(value) { return getCompatBytes(value); }
}

/**
 * 
 * @param {UStack} stack 
 * @returns {ArrayBufferLike}
 */
function getStackBytes(stack) {
    const bytes = [
        getCompatBytes(stack.nodeId),
        getCompatBytes(stack.stateNodeId),
        new BigInt64Array([stack.probeMask]).buffer,
        new Int32Array([stack.latentAction]).buffer,
    ];

    if (stack.nodeId !== 0)
        bytes.push(getCompatBytes(stack.offset));

    return concatenateArrayBuffer(bytes);
}

/**
 * 
 * @param {number} value 
 * @returns {ArrayBufferLike}
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

        if (absValue >= fit)
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

/**
 * @param {Map<string, number>} nameHash
 * @param {UProperty} prop 
 * @param {number} index 
 * @param {number} dataSize
 * @returns {ArrayBufferLike}
 */
function getTagBytes(nameHash, prop, index, dataSize) {
    const bytes = [];
    const nameId = nameHash.get(prop.propertyName);

    const nameBytes = getCompatBytes(nameId);

    bytes.push(nameBytes);

    let info = 0;
    const isArray = prop.arrayDimensions > 1;
    const isBoolean = prop instanceof UnProperties.UBoolProperty;

    if (isBoolean && isArray)
        debugger;

    if (isArray || isBoolean && prop.getPropertyValue())
        info |= UNP_PropertyMasks.PROPERTY_ARRAY_MASK;

    const typeName = `UNP_${prop.constructor.friendlyName}`;

    if (!(typeName in UNP_PropertyTypes))
        throw new Error("Unsupported property type!");

    info |= UNP_PropertyTypes[typeName];

    let complexDatasize = null;

    switch (dataSize) {
        case 1: info |= UNP_DataTypeSizes.StaticSize1; break;
        case 2: info |= UNP_DataTypeSizes.StaticSize2; break;
        case 4: info |= UNP_DataTypeSizes.StaticSize4; break;
        case 12: info |= UNP_DataTypeSizes.StaticSize12; break;
        case 16: info |= UNP_DataTypeSizes.StaticSize16; break;
        default:
            if (dataSize > 0xffff) {
                info |= UNP_DataTypeSizes.DynamicSizeUint32;
                complexDatasize = new Uint32Array([dataSize]).buffer;
                break;
            }
            if (dataSize > 0xff) {
                info |= UNP_DataTypeSizes.DynamicSizeUint16;
                complexDatasize = new Uint16Array([dataSize]).buffer;
                break;
            }
            info |= UNP_DataTypeSizes.DynamicSizeUint8;
            complexDatasize = new Uint8Array([dataSize]).buffer;
            break;
    }

    bytes.push(new Uint8Array([info]).buffer);

    if (typeName === "UNP_StructProperty") {
        const structName = prop.value.friendlyName;
        const structNameId = nameHash.get(structName);

        bytes.push(getCompatBytes(structNameId));
    }

    if (complexDatasize !== null) bytes.push(complexDatasize);

    if (isArray) {
        debugger;
    }

    return concatenateArrayBuffer(bytes);
}

/**
 * 
 * @param {Map<string, number>} nameHash
 * @param {UProperty} prop 
 * @param {number} index 
 * @returns {ArrayBufferLike}
 */
function getPropBytes(object, nameHash, prop, index) {

    /**
     * @type {ArrayBuffer}
     */
    let propValueBytes;

    switch (prop.constructor.name) {
        case "IntProperty": propValueBytes = new Int32Array([prop.getPropertyValue(index)]).buffer; break;
        case "FloatProperty": propValueBytes = new Float32Array([prop.getPropertyValue(index)]).buffer; break;
        case "BoolProperty": propValueBytes = new ArrayBuffer(0); break;
        case "ByteProperty": propValueBytes = new Uint8Array([prop.getPropertyValue(index)]).buffer; break;
        case "StructProperty": propValueBytes = serializeObject(nameHash, prop.getPropertyValue(index)); break;
        case "NameProperty":
        case "ObjectProperty":
            propValueBytes = getCompatBytes(prop.propertyValue[index].value);
            break;
        case "StrProperty": propValueBytes = getStrBytes(prop.getPropertyValue(index)); break;
        case "ArrayProperty": propValueBytes = getArrayPropertyBytes(nameHash, prop.getPropertyValue(index)); break;
        default:
            debugger;
            throw new Error("Unsupported datatype");
    }

    const propTagBytes = getTagBytes(nameHash, prop, index, propValueBytes.byteLength);
    const bytes = [propTagBytes, propValueBytes];

    return concatenateArrayBuffer(bytes);
}

/**
 * 
 * @param {Map<string, number>} nameHash
 * @param {UObject} object 
 */
function serializeObject(nameHash, object) {
    const setProps = [];

    if (object.stack)
        setProps.push(getStackBytes(object.stack));

    const isNative = ["Vector", "Rotator", "Color"].includes(object.constructor.friendlyName);

    if (isNative) {
        for (const prop of object.propertyDict.values()) {
            if (prop.arrayDimensions !== 1)
                throw new Error("This shouldnt happen");

            switch (prop.constructor.name) {
                case "FloatProperty": setProps.push(new Float32Array([prop.getPropertyValue()]).buffer); break;
                case "IntProperty": setProps.push(new Int32Array([prop.getPropertyValue()]).buffer); break;
                case "ByteProperty": setProps.push(new Uint8Array([prop.getPropertyValue()]).buffer); break;
                default:
                    debugger;
                    throw new Error("This shouldnt happen");
            }
        }
    } else {
        for (const prop of object.propertyDict.values()) {
            for (let i = 0; i < prop.arrayDimensions; i++) {
                if (!prop.isSet[i] || prop.isDefault[i])
                    continue;

                const propBytes = getPropBytes(object, nameHash, prop, i);

                setProps.push(propBytes);
            }
        }

        const noneId = nameHash.get("None");
        const noneCompat = getCompatBytes(noneId);

        setProps.push(noneCompat);

    }

    if (object.nativeBytes)
        setProps.push(object.nativeBytes.bytes.buffer);

    return concatenateArrayBuffer(setProps);
}

/**
 * 
 * @param {ArrayBufferLike[]} buffers 
 * @returns {ArrayBufferLike}
 */
function concatenateArrayBuffer(buffers) {
    const totalLen = buffers.reduce((acc, v) => acc + v.byteLength, 0);
    const arrayBuffer = new ArrayBuffer(totalLen);
    const view = new Uint8Array(arrayBuffer)

    for (let i = 0, len = buffers.length, offset = 0; i < len; i++) {
        const b = buffers[i];

        view.set(new Uint8Array(b), offset);
        offset = offset + b.byteLength;
    }

    return arrayBuffer;
}

/**
 * 
 * @param {string} value 
 * @returns {ArrayBufferLike}
 */
function getStrBytes(value) {
    const len = value.length;
    const bytes = new Uint8Array(len + 2);

    bytes[0] = value.length + 1;

    for (let i = 0; i < len; i++)
        bytes[i + 1] = value.charCodeAt(i);

    return bytes.buffer;
}

/**
 * 
 * @param {FArray|FNameArray|FObjectArray|FIndexArray|FPrimitiveArray} array 
 * @returns {ArrayBufferLike}
 */
function getArrayPropertyBytes(nameHash, array) {
    const bytes = [getCompatBytes(array.length)];

    if (array instanceof UnArrays.FArray) {
        const constr = array.getConstructor();

        if (constr.isDynamicClass) {
            for (const obj of array) {
                bytes.push(serializeObject(nameHash, obj));
            }
        } else {

            debugger;
        }
    } else if (array instanceof UnArrays.FObjectArray || array instanceof UnArrays.FNameArray) {
        for (const compat of array.getIndexList()) {
            bytes.push(getCompatBytes(compat));
        }
    } else if (array instanceof UnArrays.FPrimitiveArray) {
        bytes.push(array.getArrayBufferSlice());
    } else {
        debugger;
        throw new Error("Unsupported array type");
    }

    return concatenateArrayBuffer(bytes);
}