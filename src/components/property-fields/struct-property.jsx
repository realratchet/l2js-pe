import React from "react";
import { Button, TextField } from "@mui/material";
import IPCClient from "../../../electron-app/events/ipc-client";

function StructProperty({ history: [activeHistory, setHistory], value, name, object }) {
    const structName = !!value ? `Struct[${value.type}]` : "None";
    
    async function onClick() {
        setHistory([...activeHistory, {
            type: "struct",
            name: name,
            parent: object,
            propertyName: name,
            value
        }]);
    }

    return (
        <Button variant="standard" disabled={!value} onClick={onClick}>
            {structName}
        </Button>
    );
}

export default StructProperty;
export { StructProperty };