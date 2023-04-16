import path from "path";
import * as PropFields from "./property-fields/properties";
import { ipcRenderer } from "electron";
import { Fragment, useEffect, useMemo, useState } from "react";
import TwoWayPanel from "./two-way-panel.jsx";
import { Accordion, AccordionDetails, AccordionSummary, Grid, List, ListItem, ListItemButton, Paper } from "@mui/material";
import IPCClient from "../../electron-app/events/ipc-client";
import styled from "@emotion/styled";
import { Box } from "@mui/system";

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
    minWidth: "fit-content"
}));

const FlexBox = styled(Box)(() => ({ display: "flex", flex: 1, overflow: "auto" }));

function Editor({ history, filter }) {
    const [activeHistory, setHistory] = history;
    const statePkgList = useState([]);

    useEffect(() => {
        const [pkgList, setPkgList] = statePkgList;

        if (pkgList.length === 0) {
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
        const byExt = useMemo(() => {
            console.log("recalc ext")
            return activePkgList.reduce((acc, fname) => {

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
        }, [activePkgList]);

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

            setHistory({
                type: "push", payload: {
                    type: "package",
                    name: pkg.name,
                    value: pkgContents
                }
            });
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
                filter={filter}
                onCreateElement={onCreateItemElement}
            />
        );
    }

    const { type, value } = activeHistory[activeHistory.length - 1];

    switch (type) {
        case "package": return getPackageEditor({ history, filter }, value);
        case "object": return getObjectEditor({ history, filter }, value);
        default: throw new Error(`Unsupported history type: ${type}`);
    }
}

export default Editor;
export { Editor };

function getObjectEditor({ history, filter }, { type, index, filename, value }) {
    const [activeHistory,] = history;
    const groups = useMemo(() => {
        return Object.entries(value).reduce((acc, [propName, propVal]) => {
            const category = propVal.category || "None";
            const container = acc[category] = acc[category] || [];

            container.push({ name: propName, value: propVal });

            return acc;
        }, {});
    }, [value]);

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
            filter={filter}
            onCreateElement={onCreateItemElement}
        />
    );
}

function getPackageEditor({ history, filter }, { filename, exports }) {
    const [activeHistory, setHistory] = history;
    const groups = useMemo(() => {
        return exports.reduce((acc, exp) => {
            const container = acc[exp.type] = acc[exp.type] || [];

            container.push(exp);

            return acc;
        }, {})
    }, [exports]);

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

        setHistory({
            type: "push", payload: {
                type: "object",
                name: object.name,
                value: object
            }
        });
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
            filter={filter}
            onCreateElement={onCreateItemElement}
        />
    );
}

function getPropertyField({ type, names, value, enumName }) {
    const props = {};

    let Field;

    switch (type) {
        case "uint8": Field = PropFields.Uint8Property; break;
        case "int32": Field = PropFields.Int32Property; break;
        case "boolean": Field = PropFields.BooleanProperty; break;
        case "name": Field = PropFields.NameProperty; break;
        case "string": Field = PropFields.StringProperty; break;
        case "float": Field = PropFields.FloatProperty; break;
        case "enum":
            Field = PropFields.EnumProperty;
            props.enumName = enumName;
            props.names = names;
            break;
        default: Field = () => `'${type}' not implemented`;
    }


    if (value instanceof Array) {
        return (
            <List>
                <Accordion>
                    <AccordionSummary>{value.length} elements</AccordionSummary>
                    <AccordionDetails>
                        {
                            value.map((v, index) => {
                                return (
                                    <ListItem key={index}>
                                        <Field {...props} value={v} />
                                    </ListItem>
                                );
                            })
                        }
                    </AccordionDetails>
                </Accordion>
            </List>
        );
    }

    return <Field {...props} value={value} />;
}