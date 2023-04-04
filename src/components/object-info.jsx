import { ipcRenderer } from "electron";
import { Fragment, useState } from "react";

import PropTypes from "prop-types";
import { Box, Button, Container, List, ListItem, ListItemButton, Paper, Tab, Tabs, Typography } from "@mui/material";

function TabPanel(props) {
    const {children, value, index, classes, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
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

function ObjectInfo({ pkg: [activePkg,] }) {
    const groups = (activePkg?.exports || null)?.reduce((acc, exp) => {
        const container = acc[exp.type] = acc[exp.type] || [];

        container.push(exp);

        return acc;
    }, {});

    const groupKeys = Object.keys(groups || {})/*.slice(0, 10)*/, groupCount = groupKeys.length;

    const [value, setValue] = useState(0);
    const handleChange = (event, newValue) => setValue(newValue);

    // debugger;

    return (
        <Box
            sx={{ display: "flex", flex: 1, height: "100%", overflow: "auto" /*flexGrow: 1, display: "flex", flex: 1, height: "100%"*/ }}
        >
            {
                !groups
                    ? <Fragment>
                        <div>No package selected</div>
                    </Fragment>
                    : <Fragment>
                        <Tabs
                            orientation="vertical"
                            variant="scrollable"
                            value={value}
                            onChange={handleChange}
                            aria-label="Vertical tabs example"
                            sx={{ borderRight: 1, borderColor: "divider", /*height: "calc(100% - 66px)"*/ }}
                        >
                            {
                                groupKeys.map((groupName, index) => {
                                    return <Tab key={index} label={groupName} {...a11yProps(groupName)} />
                                })
                            }
                        </Tabs>
                        <Fragment>
                            <Box
                                sx={{ display: "flex", flex: 1, overflow: "auto" }}
                            >
                                {groupKeys.map((groupName, index) => {
                                    return (
                                        <TabPanel key={`${groupName}-panel-${index}`} value={value} index={index}>
                                            <List key={`${groupName}-list-${index}`}>
                                                {
                                                    groups[groupKeys[index]].map(({ index, name }) => {
                                                        return (
                                                            <ListItem key={`${groupName}-li-${index}`}>
                                                                <ListItemButton key={`${groupName}-lib-${index}`}>{name}</ListItemButton>
                                                            </ListItem>
                                                        );
                                                    })
                                                }
                                            </List>
                                        </TabPanel>
                                    );
                                })}
                            </Box>
                        </Fragment>
                    </Fragment>
            }
        </Box>
    );
}

export default ObjectInfo;
export { ObjectInfo };