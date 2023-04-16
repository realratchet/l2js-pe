import React, { useState } from "react";
import { TextField } from "@mui/material";

function clamp(x, min, max) { return Math.max(Math.min(x, max), min); }

function IntProperty({ value, label, min, max, radix = 10 }) {
    const [curValue, setCurValue] = useState(value);
    const [curError, setError] = useState(false);
    const [curRadix, setRadix] = useState(radix);
    const [curDisplayValue, setDisplayCurValue] = useState(value);

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
        setDisplayCurValue(curRadix === 16 ? `0x${curValue.toString(curRadix)}` : curValue);
        setError(false);
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