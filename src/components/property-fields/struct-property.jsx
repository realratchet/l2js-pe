import React from "react";
import { Button, TextField } from "@mui/material";
import IPCClient from "../../../electron-app/events/ipc-client";

function StructProperty({ history: [activeHistory, setHistory], value, name, object, index }) {
    const structName = !!value ? `Struct[${value.type}]` : "None";
    
    // debugger;

    async function onClick() {
        setHistory([...activeHistory, {
            type: "struct",
            name: name,
            parent: object,
            propertyName: name,
            propertyIndex: index,
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