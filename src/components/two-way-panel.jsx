import { Fragment, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Container, List, ListItem, styled, Tab, Tabs, Typography } from "@mui/material";
import { compareTwoStrings } from "string-similarity"

function TwoWayPanel({ collection, filter: [filter, setFilter], onCreateElement, minSimilarity = 0.8, maxSearchElements = 15 }) {
    if (!collection)
        return <div>Nothing to show.</div>

    const [value, setValue] = useState(0);
    const handleChange = (event, newValue) => setValue(newValue);

    useEffect(() => {
        setValue(0);
        setFilter("");
    }, [collection]);

    const reverseMap = useMemo(() => {
        return Object.keys(collection).reduce((acc, key) => {
            let index = 0;

            for (let obj of collection[key]) {
                const name = obj.name;

                if (name in acc)
                    throw new Error(`'${name}' already exists, can this even happen?`);

                acc[name] = [key, obj, index++];
            };

            return acc;
        }, {});
    }, [collection]);

    const filteredItems = useMemo(() => {
        if (filter.length === 0) return [];

        const filterLower = filter.toLowerCase();
        const ratings = Object
            .keys(reverseMap)
            .map(key => {
                const keyLower = key.toLowerCase();
                const similarity = keyLower.includes(filterLower)
                    ? 1
                    : compareTwoStrings(filterLower, keyLower);

                return [key, similarity];
            })
            .filter(([k, s]) => s >= minSimilarity)
            .sort(([sa, a], [sb, b]) => {
                const result = b - a;

                if (result !== 0) return result;

                const lenResult = sa.length - sb.length;

                if (lenResult !== 0) return lenResult

                if (sb > sa) return -1;
                if (sa === sb) return 0;

                return 1;
            });

        return ratings.map(([k,]) => reverseMap[k]);
    }, [reverseMap, filter]);

    if (filter?.length > 0) {
        return (
            <RootFlexBox key="default">
                <TabsParent value={0} handleChange={handleChange}>
                    <Tab label="Search" {...a11yProps("Search")} />
                </TabsParent>
                <ScrollableFlexBox>
                    <TabPanel value={0} index={0}>
                        <List>
                            {
                                filteredItems.slice(0, maxSearchElements).map(([collectionKey, item, trueIndex], index) => {
                                    return (
                                        <ListItem key={index}>
                                            {onCreateElement(collectionKey, trueIndex, item)}
                                        </ListItem>
                                    );
                                })
                            }
                            {
                                filteredItems.length > maxSearchElements
                                    ? (
                                        <ListItem>
                                            <Typography color="text.primary">
                                                {filteredItems.length - maxSearchElements} more hidden results...
                                            </Typography>
                                        </ListItem>
                                    )
                                    : null
                            }
                        </List>
                    </TabPanel>
                </ScrollableFlexBox>
            </RootFlexBox>
        );
    }

    const collectionKeys = Object.keys(collection || {});

    return (
        <RootFlexBox key="default">
            <TabsParent value={value} handleChange={handleChange}>
                {
                    collectionKeys.map((collectionKey, index) => (
                        <Tab key={index} label={collectionKey} {...a11yProps(collectionKey)} />
                    ))
                }
            </TabsParent>
            <ScrollableFlexBox>
                {
                    collectionKeys.length === 0 ? null : [collectionKeys[value]].map((collectionKey, index) => {
                        return (
                            <TabPanel key={index} value={0} index={index}>
                                <List>
                                    {
                                        collection[collectionKeys[value]].map((item, index) => {
                                            const similarity = filter && filter.length > 0
                                                ? item.name.toLowerCase().includes(filter)
                                                    ? 1
                                                    : compareTwoStrings(filter.toLowerCase(), item.name.toLowerCase())
                                                : 1;

                                            if (similarity < 0.8)
                                                return null;

                                            return (
                                                <ListItem key={index}>
                                                    {onCreateElement(collectionKey, index, item)}
                                                </ListItem>
                                            );
                                        })
                                    }
                                </List>
                            </TabPanel>
                        );
                    })
                }
            </ScrollableFlexBox>
        </RootFlexBox>
    );
}

export default TwoWayPanel;
export { TwoWayPanel };


const FlexBox = styled(Box)(() => ({ display: "flex", flex: 1, overflow: "auto" }));
const RootFlexBox = styled(FlexBox)(() => ({ height: "100%" }));
const ScrollableFlexBox = styled(FlexBox)(() => ({
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
        width: '0.4em',
    },
    '&::-webkit-scrollbar-track': {
        background: "#f1f1f1",
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#888',
    },
    '&::-webkit-scrollbar-thumb:hover': {
        background: '#555'
    }
}));

function TabPanel(props) {
    const { children, value, index, classes, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            style={{ flex: "1" }}
            {...other}
        >
            {value === index && (
                <Container>
                    <Box>
                        {children}
                    </Box>
                </Container>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        "aria-controls": `vertical-tabpanel-${index}`,
    };
}

function TabsParent({ value, handleChange, children }) {
    return (
        <Tabs
            orientation="vertical"
            variant="scrollable"
            value={value}
            onChange={handleChange}
            sx={{ borderRight: 1, borderColor: "divider" }}
        >{children}</Tabs>
    );
}