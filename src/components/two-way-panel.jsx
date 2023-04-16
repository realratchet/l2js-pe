import { Fragment, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Container, List, ListItem, styled, Tab, Tabs } from "@mui/material";
import { compareTwoStrings } from "string-similarity"

function TwoWayPanel({ collection, filter: [filter, setFilter], onCreateElement }) {
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

            for (const obj of collection[key]) {
                const name = obj.name;

                if (name in acc)
                    throw new Error(`'${name}' already exists, can this even happen?`);

                acc[name] = obj;
            }

            return acc;
        }, {});
    }, [collection]);

    if (filter?.length > 0) {

        return (
            <RootFlexBox key="default">
                <TabsParent value={value} handleChange={handleChange}>
                    <Tab label="Search" {...a11yProps("Search")} />
                </TabsParent>
                <ScrollableFlexBox>
                    <TabPanel value={0} index={0}>
                    <List>
                        <div>aaaa</div>
                        <div>bbbb</div>
                        <div>cccc</div>
                    </List>
                    </TabPanel>
                </ScrollableFlexBox>
            </RootFlexBox>
        );
    }

    // useEffect(() => {
    //     setFilter("");
    // }, [value]);

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