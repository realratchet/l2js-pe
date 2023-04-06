import React, { useState } from "react";
import { TextField } from "@mui/material";

function clamp(x, min, max) { return Math.max(Math.min(x, max), min); }

function IntProperty({ value, label, min, max }) {
    const regex = /((?<zero>(-|\+)?0)$|^(?<sign>(-|\+)?)0*(?<value>([1-9][0-9]*$)))/;
    const [curValue, setCurValue] = useState(value);

    function onInput({ target: { value } }) {

        value = value.length === 0 ? "0" : value;

        const matches = value.match(regex);

        if (matches) {
            const { zero, sign, value } = matches.groups;

            setCurValue(clamp(zero === undefined ? `${sign}${value}` : 0, min, max));
            return;
        }
    }

    return <TextField
        id="standard-basic"
        label={label}
        variant="standard"
        value={curValue}
        inputMode="numeric"
        type="text"
        onInput={onInput}
    />
}

export default IntProperty;
export { IntProperty };