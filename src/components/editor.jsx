import path from "path";
import * as PropFields from "./property-fields/properties";
import { ipcRenderer } from "electron";
import { Fragment, useEffect, useState } from "react";
import TwoWayPanel from "./two-way-panel.jsx";
import { Grid, List, ListItem, ListItemButton, Paper } from "@mui/material";
import IPCClient from "../../electron-app/events/ipc-client";
import styled from "@emotion/styled";
import { Box } from "@mui/system";

function Editor({ history }) {
    const [activeHistory, setHistory] = history;
    const statePkgList = useState([]);

    useEffect(() => {
        const [pkgList, setPkgList] = statePkgList;
        console.log("use editor effect.");

        if (pkgList.length === 0) {
            console.log("need to reload packages");
            (async function () {
                setPkgList(await IPCClient.send("user-interaction", {
                    type: "list-packages",
                    payload: process.env.PATH_LINEAGE2
                }));
            })();
        }
    }, []);

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

            setHistory([...activeHistory, {
                type: "package",
                name: pkg.name,
                value: pkgContents
            }]);
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
                key={activeHistory.length}
                collection={byExt}
                onCreateElement={onCreateItemElement}
            />
        );
    }

    const { type, value } = activeHistory[activeHistory.length - 1];

    switch (type) {
        case "package": return getPackageEditor(history, value);
        case "object": return getObjectEditor(history, value);
        default: throw new Error(`Unsupported history type: ${type}`);
    }
}

export default Editor;
export { Editor };

function getObjectEditor(history, { type, index, filename, value }) {
    const [activeHistory, setHistory] = history;
    const groups = Object.entries(value).reduce((acc, [propName, propVal]) => {
        const category = propVal.category || "None";
        const container = acc[category] = acc[category] || [];

        container.push({ name: propName, value: propVal });

        return acc;
    }, {});

    const Item = styled(Paper)(({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
        ...theme.typography.body2,
        padding: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    }));

    const FlexBox = styled(Box)(() => ({ display: "flex", flex: 1, overflow: "auto" }));

    function onCreateItemElement(collectionKey, index, { name, value }) {
        return (
            <FlexBox key={index} >
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <Item>{name}</Item>
                    </Grid>
                    <Grid item xs={2}>
                        <Item>{getPropertyField(value)}</Item>
                    </Grid>
                </Grid>
            </FlexBox>

        );
    }

    return (
        <TwoWayPanel
            key={activeHistory.length}
            collection={groups}
            onCreateElement={onCreateItemElement}
        />
    );
}

function getPackageEditor(history, { filename, exports }) {
    const [activeHistory, setHistory] = history;
    const groups = exports.reduce((acc, exp) => {
        const container = acc[exp.type] = acc[exp.type] || [];

        container.push(exp);

        return acc;
    }, {});

    async function onClick({ target }) {
        const collectionId = target.getAttribute("data-collection");
        const dataId = target.getAttribute("data-index");
        const expInfo = groups[collectionId][dataId];
        const object = await IPCClient.send("user-interaction", {
            type: "fetch-export",
            payload: {
                path: filename,
                index: expInfo.index + 1
            }
        });

        setHistory([...activeHistory, {
            type: "object",
            name: object.name,
            value: object
        }]);
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
            key={activeHistory.length}
            collection={groups}
            onCreateElement={onCreateItemElement}
        />
    );
}

function getPropertyField({ type, value }) {
    let Field;

    switch (type) {
        case "uint8": Field = PropFields.Uint8Property; break;
        case "int32": Field = PropFields.Int32Property; break;
        case "boolean": Field = PropFields.BooleanProperty; break;
        default: Field = () => `'${type}' not implemented`;
    }


    if (value instanceof Array) {
        return (
            <List>
                {
                    value.map((v, index) => {
                        return (
                            <ListItem key={index}>
                                <Field value={v} />
                            </ListItem>
                        );
                    })
                }
            </List>
        );
    }

    return <Field value={value} />;
}