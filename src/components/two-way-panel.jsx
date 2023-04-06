import { Fragment, useState } from "react";
import PropTypes from "prop-types";
import { Box, Container, List, ListItem, styled, Tab, Tabs } from "@mui/material";

const FlexBox = styled(Box)(() => ({ display: "flex", flex: 1, overflow: "auto" }));
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

function TwoWayPanel({ collection, onCreateElement }) {
    if (!collection)
        return <div>Nothing to show.</div>

    const [value, setValue] = useState(0);
    const handleChange = (event, newValue) => setValue(newValue);

    const collectionKeys = Object.keys(collection || {});

    return (
        <FlexBox sx={{ height: "100%" }}>
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={value}
                onChange={handleChange}
                sx={{ borderRight: 1, borderColor: "divider" }}
            >
                {
                    collectionKeys.map((collectionKey, index) => (
                        <Tab key={index} label={collectionKey} {...a11yProps(collectionKey)} />
                    ))
                }
            </Tabs>
            <Fragment>
                <ScrollableFlexBox>
                    {
                        collectionKeys.map((collectionKey, index) => {
                            return (
                                <TabPanel key={index} value={value} index={index}>
                                    <List key={index}>
                                        {
                                            collection[collectionKeys[index]].map((item, index) => (
                                                <ListItem key={index}>
                                                    {onCreateElement(collectionKey, index, item)}
                                                </ListItem>
                                            ))
                                        }
                                    </List>
                                </TabPanel>
                            );
                        })
                    }
                </ScrollableFlexBox>
            </Fragment>
        </FlexBox>
    );
}

export default TwoWayPanel;
export { TwoWayPanel };