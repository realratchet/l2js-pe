import React from "react";
import { Button, TextField } from "@mui/material";
import IPCClient from "../../../electron-app/events/ipc-client";

function ObjectProperty({ history: [activeHistory, setHistory], value, index, names, pkgName, pkgExt }) {
    async function onClick() {
        const object = await IPCClient.send("user-interaction", {
            type: "fetch-export",
            payload: {
                ext: pkgExt,
                name: pkgName,
                index: value
            }
        });

        setHistory([...activeHistory, {
            type: "object",
            name: object.name,
            value: object
        }]);
    }

    return (
        <Button variant="standard" disabled={value === 0} onClick={onClick}>
            {names[index] || "None"}
        </Button>
    );
}

export default ObjectProperty;
export { ObjectProperty };