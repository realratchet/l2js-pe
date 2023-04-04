import { ipcRenderer } from "electron";
import { Fragment, useState } from "react";
import TwoWayPanel from "./two-way-panel.jsx";
import { ListItemButton } from "@mui/material";

function ObjectInfo({ pkg: [activePkg,] }) {
    const groups = (activePkg?.exports || null)?.reduce((acc, exp) => {
        const container = acc[exp.type] = acc[exp.type] || [];

        container.push(exp);

        return acc;
    }, {});


    function onCreateElement(index, { name }) {
        return (
            <ListItemButton key={index}>
                {name}
            </ListItemButton>
        )
    }

    return (
        <TwoWayPanel
            collection={groups}
            onCreateElement={onCreateElement}
        />
    );
}

export default ObjectInfo;
export { ObjectInfo };