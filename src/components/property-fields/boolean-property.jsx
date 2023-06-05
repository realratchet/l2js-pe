import React, { useState } from "react";
import { MenuItem, Select } from "@mui/material";
import IPCClient from "../../../electron-app/events/ipc-client";

function BooleanProperty({ value, object, propertyName, index }) {
    const [curValue, setCurValue] = useState(value);

    async function handleChange({ target: { value } }) {
        setCurValue(value);

        await IPCClient.send("user-interaction", {
            type: "update-property",
            payload: {
                object,
                propertyName,
                propertyIndex: index,
                propertyValue: value
            }
        });
    }

    return (
        <Select value={curValue} label="boolean" onChange={handleChange}>
            <MenuItem value={false}>False</MenuItem>
            <MenuItem value={true}>True</MenuItem>
        </Select>
    );
}

export default BooleanProperty;
export { BooleanProperty };