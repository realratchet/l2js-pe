import path from "path";
import { ipcRenderer } from "electron";
import { Fragment, useState } from "react";
import TwoWayPanel from "./two-way-panel.jsx";
import { ListItemButton } from "@mui/material";

/**
 * @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]}
 */
let statePkgList;

function Editor({ pkg: [activePkg,], history: [activeHistory, setHistory] }) {
    statePkgList = useState([]);

    if (activeHistory.length === 0) {
        const [activePkgList,] = statePkgList;
        const byExt = activePkgList.reduce((acc, fname) => {
            const ext = path.extname(fname);
            const grpName = ext.slice(1).toUpperCase();

            if (!(grpName in acc))
                acc[grpName] = [];

            acc[grpName].push({
                name: path.basename(fname, ext),
                path: fname
            });

            return acc;
        }, {});

        function onCreateItemElement(index, { name }) {
            return (
                <ListItemButton key={index}>
                    {name}
                </ListItemButton>
            );
        }

        return (
            <TwoWayPanel
                collection={byExt}
                onCreateElement={onCreateItemElement}
            />
        );
    }

    const groups = (activePkg?.exports || null)?.reduce((acc, exp) => {
        const container = acc[exp.type] = acc[exp.type] || [];

        container.push(exp);

        return acc;
    }, {});


    function onCreateItemElement(index, { name }) {
        return (
            <ListItemButton key={index}>
                {name}
            </ListItemButton>
        );
    }


    return (
        <TwoWayPanel
            collection={groups}
            onCreateElement={onCreateItemElement}
        />
    );
}

export default Editor;
export { Editor };

async function onUserInteractionReply(_, { type, payload } = {}) {
    const [, setPkgList] = statePkgList;

    switch (type) {
        case "list-packages": setPkgList(payload); break;
        case "read-package": break;
        case "load-export": break;
        default: throw new Error(`Unsupported event type: ${type}`);
    }
}

ipcRenderer.on("user-interaction-reply", onUserInteractionReply);

window.addEventListener("DOMContentLoaded", async function () {
    setTimeout(function () {
        ipcRenderer.send("user-interaction", {
            type: "list-packages",
            payload: process.env.PATH_LINEAGE2
        });
    }, 500); // small delay because the debugger within electron takes some time to attach
});