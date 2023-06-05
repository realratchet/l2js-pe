import path from "path";
import * as PropFields from "./property-fields/properties";
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
const SetItem = styled(Item)(({ theme }) => ({
    color: "rgba(255, 255, 200, 0.7)",
    backgroundColor: "rgba(26, 32, 0, 0.7)"
}));

const SetListItem = styled(ListItem)(({ theme }) => ({
    color: "rgba(255, 255, 100, 0.7)",
    backgroundColor: "rgba(26, 32, 0, 0.3)"
}));

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
                filter={filter}
                onCreateElement={onCreateItemElement}
            />
        );
    }

    const value = activeHistory[activeHistory.length - 1];
    const type = value.type;

    switch (type) {
        case "package": return getPackageEditor({ history, filter }, value);
        case "object": return getObjectEditor({ history, filter }, value);
        case "struct": return getStructEditor({ history, filter }, value);
        default: {
            useMemo(() => { });
            return <div>{`Unsupported history type '${type}'`}</div>
        };
    }
}

export default Editor;
export { Editor };

function getStructEditor({ history, filter }, { parent, propertyName, propertyIndex, value: { type, value } }) {
    const [activeHistory,] = history;
    const groups = useMemo(() => {
        const props = Object.entries(value).reduce((acc, [propName, propVal]) => {
            const category = propVal.category || "None";
            const container = acc[category] = acc[category] || [];

            container.push({ name: propName, value: propVal });

            return acc;
        }, {});

        for (let v of Object.values(props)) {
            v.sort(({ value: { isSet: a } }, { value: { isSet: b } }) => {
                const _a = a.includes(true) ? 1 : 0, _b = b.includes(true) ? 1 : 0;

                return _b - _a;
            })
        }

        return props;
    }, [value]);

    const object = {
        type: "struct",
        parent,
        propertyName,
        propertyIndex
    };

    function onCreateItemElement(collectionKey, index, { name: propertyName, value: propertyValue }) {
        const ThemedItem = propertyValue.isSet.includes(true) ? SetItem : Item;

        return (
            <FlexBox key={index} >
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <ThemedItem>{propertyName}</ThemedItem>
                    </Grid>
                    <Grid item xs={2}>
                        {getPropertyField(history, object, propertyName, propertyValue)}
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

function getObjectEditor({ history, filter }, { value: { type, index, filename, value } }) {
    const [activeHistory,] = history;
    const groups = useMemo(() => {
        const props = Object.entries(value).reduce((acc, [propName, propVal]) => {
            const category = propVal.category || "None";
            const container = acc[category] = acc[category] || [];

            container.push({ name: propName, value: propVal });

            return acc;
        }, {});

        for (let v of Object.values(props)) {
            v.sort(({ value: { isSet: a } }, { value: { isSet: b } }) => {
                const _a = a.includes(true) ? 1 : 0, _b = b.includes(true) ? 1 : 0;

                return _b - _a;
            })
        }

        return props;
    }, [value]);

    const object = {
        type: "object",
        index,
        filename
    };

    function onCreateItemElement(collectionKey, index, { name: propertyName, value: propertyValue }) {
        const ThemedItem = propertyValue.isSet.includes(true) ? SetItem : Item;

        return (
            <FlexBox key={index} >
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <ThemedItem>{propertyName}</ThemedItem>
                    </Grid>
                    <Grid item xs={2}>
                        {getPropertyField(history, object, propertyName, propertyValue)}
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

function getPackageEditor({ history, filter }, { value: { filename, exports } }) {
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
            filter={filter}
            onCreateElement={onCreateItemElement}
        />
    );
}

function getPropertyField(history, object, propertyName, { type, dynamic, isSet, isDefault, names, value, enumName, package: pkg }) {
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
        case "object":
            Field = PropFields.ObjectProperty;
            props.names = names instanceof Array ? names : [names];
            props.history = history;
            [props.pkgName, props.pkgExt] = pkg;
            break;
        case "struct":
            props.name = propertyName;
            props.history = history;
            Field = PropFields.StructProperty;
            break;

        default: Field = () => `'${type}' not implemented`; break;
    }


    if (value instanceof Array) {
        const arrLen = value.length;
        const ThemedItem = dynamic && isSet[0] ? SetItem : Item;

        if (arrLen <= 100) {
            return (
                <ThemedItem>
                    <List>
                        <Accordion>
                            <AccordionSummary>{arrLen} elements</AccordionSummary>
                            <AccordionDetails>
                                {
                                    value.map((v, index) => {
                                        const ThemedListItem = !dynamic && isSet[index] ? SetListItem : ListItem;

                                        return (
                                            <ThemedListItem key={index}>
                                                <Field
                                                    index={index}
                                                    isSet={isSet}
                                                    isDefault={isDefault}
                                                    propertyName={propertyName}
                                                    object={object}
                                                    {...props}
                                                    value={v} />
                                            </ThemedListItem>
                                        );
                                    })
                                }
                            </AccordionDetails>
                        </Accordion>
                    </List>
                </ThemedItem>
            );
        }

        const elements = [];

        for (let startIndex = 0, i = 0; startIndex < arrLen; i++) {
            const finishIndex = Math.min(startIndex + 100, arrLen);

            elements.push(
                <List index={i}>
                    <Accordion>
                        <AccordionSummary>{startIndex} - {finishIndex} elements</AccordionSummary>
                        <AccordionDetails>
                            {
                                value
                                    .slice(startIndex, finishIndex)
                                    .map((v, index) => {
                                        const ThemedListItem = !dynamic && isSet[index] ? SetListItem : ListItem;

                                        return (
                                            <ThemedListItem key={index}>
                                                <Field
                                                    index={index}
                                                    isSet={isSet}
                                                    isDefault={isDefault}
                                                    propertyName={propertyName}
                                                    object={object}
                                                    {...props}
                                                    value={v} />
                                            </ThemedListItem>
                                        );
                                    })
                            }
                        </AccordionDetails>
                    </Accordion>
                </List>
            );

            startIndex = finishIndex;
        }

        return <ThemedItem>{elements}</ThemedItem>;
    }

    const ThemedItem = isSet[0] ? SetItem : Item;

    return (
        <ThemedItem>
            <Field
                index={0}
                isSet={isSet}
                isDefault={isDefault}
                propertyName={propertyName}
                object={object}
                {...props}
                value={value} />
        </ThemedItem>
    );
}