import React, { useState } from "react";
import { TextField } from "@mui/material";
import IPCClient from "../../../electron-app/events/ipc-client";

function clamp(x, min, max) { return Math.max(Math.min(x, max), min); }
function toDisplay(value, radix) {
    return radix === 16 ? `0x${("00" + value.toString(radix)).slice(-2).toUpperCase()}` : value;
}

function IntProperty({ value, label, min, max, object, propertyName, index, isSet, radix = 10 }) {
    const [curValue, setCurValue] = useState(value);
    const [curError, setError] = useState(false);
    const [curRadix, setRadix] = useState(radix);
    const [curDisplayValue, setDisplayCurValue] = useState(toDisplay(value, radix));

    function onInput({ target: { value } }) {
        setDisplayCurValue(value);

        try {
            if (!value.match(/^((0x[\da-fA-F]+)|(\-?[\d]+))$/))
                throw new Error("Invalid pattern");

            let radix = 10;

            if (value.startsWith("0x")) radix = 16;

            const parsedValue = parseInt(value, radix);

            if (!Number.isFinite(parsedValue))
                throw new Error("Invalid value");

            if (value < min || value > max)
                throw new Error("Overflow");

            setRadix(radix);
            setCurValue(parsedValue);
            setError(false);
        } catch (e) {
            setError(true);
        }
    }


    function onBlur() {
        setDisplayCurValue(toDisplay(curValue, curRadix));
        setError(false);

        IPCClient.send("user-interaction", {
            type: "update-property",
            payload: {
                object,
                propertyName,
                propertyIndex: index
            }
        });
    }

    return (
        <TextField
            label={label}
            variant="standard"
            value={curDisplayValue}
            inputMode="numeric"
            error={curError}
            type="text"
            onInput={onInput}
            onBlur={onBlur}
        />
    );
}

export default IntProperty;
export { IntProperty };