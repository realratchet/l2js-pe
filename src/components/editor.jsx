import path from "path";
import { ipcRenderer } from "electron";
import { Fragment, useEffect, useState } from "react";
import TwoWayPanel from "./two-way-panel.jsx";
import { ListItemButton } from "@mui/material";
import IPCClient from "../../electron-app/events/ipc-client";

function Editor({ pkg: [activePkg,], history: [activeHistory, setHistory] }) {
    const statePkgList = useState([]);

    useEffect(() => {
        const [, setPkgList] = statePkgList;

        (async function () {
            setPkgList(await IPCClient.send("user-interaction", {
                type: "list-packages",
                payload: process.env.PATH_LINEAGE2
            }));
        })();
    });

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

        async function onClick({ target }) {
            const collectionId = target.getAttribute("data-collection");
            const dataId = target.getAttribute("data-index");
            const pkg = byExt[collectionId][dataId];

            const pkgContents = await IPCClient.send("user-interaction", {
                type: "read-package",
                payload: {
                    path: pkg.path
                }
            });

            debugger;
        }

        function onCreateItemElement(collectionKey, index, { name }) {
            return (
                <ListItemButton key={index} onClick={onClick} data-collection={collectionKey} data-index={index} data-key={name}>
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