import React, { useState } from "react";
import { TextField } from "@mui/material";
import IPCClient from "../../../electron-app/events/ipc-client";

function FloatProperty({ value, object, propertyName, index }) {
    const [curValue, setCurValue] = useState(value);
    const [curError, setError] = useState(false);
    const [curDisplayValue, setDisplayCurValue] = useState(value);

    function onInput({ target: { value } }) {
        setDisplayCurValue(value);

        try {
            if (!value.match(/^\-?[\d]*\.?[\d]*$/))
                throw new Error("Invalid pattern");

            const parsedValue = parseFloat(value);

            if (!Number.isFinite(parsedValue))
                throw new Error("Invalid value");

            setCurValue(parsedValue);
            setError(false);
        } catch (e) {
            setError(true);
        }
    }

    function onBlur() {
        setDisplayCurValue(curValue);
        setError(false);

        IPCClient.send("user-interaction", {
            type: "update-property",
            payload: {
                object,
                propertyName,
                propertyIndex: index,
                propertyValue: curValue
            }
        });
    }

    return (
        <TextField
            label="float"
            variant="standard"
            value={curDisplayValue}
            inputMode="numeric"
            type="text"
            error={curError}
            onInput={onInput}
            onBlur={onBlur}
        />
    );
}

export default FloatProperty;
export { FloatProperty };