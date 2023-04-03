import "../../css/app.css";
import Header from "./header.jsx";
import { ipcRenderer } from "electron";
import React, { Fragment, useState } from "react";
import ObjectInfo from "./object-info.jsx";
import { Box, Breadcrumbs, Chip, createTheme, emphasize, Link, Tab, Tabs, Typography } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import styled from "@emotion/styled";
import PropTypes from 'prop-types';

/**
 * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
 */
let statePkg;

const StyledBreadcrumb = styled(Chip)(({ theme }) => {
    const backgroundColor =
        theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[800];
    return {
        backgroundColor,
        height: theme.spacing(3),
        color: theme.palette.text.primary,
        fontWeight: theme.typography.fontWeightRegular,
        '&:hover, &:focus': {
            backgroundColor: emphasize(backgroundColor, 0.06),
        },
        '&:active': {
            boxShadow: theme.shadows[1],
            backgroundColor: emphasize(backgroundColor, 0.12),
        },
    };
}); // TypeScript only: need a type cast here because https://github.com/Microsoft/TypeScript/issues/26591


async function onUserInteractionReply(_, { type, payload } = {}) {
    const [, setPkg] = statePkg;

    switch (type) {
        case "read-package": setPkg(payload); break;
        case "load-export": break;
        default: throw new Error(`Unsupported event type: ${type}`);
    }
}

const darkTheme = createTheme({ palette: { mode: "dark" } });

function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`vertical-tabpanel-${index}`}
        aria-labelledby={`vertical-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
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
      'aria-controls': `vertical-tabpanel-${index}`,
    };
  }

function App() {
    const stateExpGroup = useState("");
    const stateExp = useState("");

    statePkg = useState("");

    const breadcrumbs = [
        <StyledBreadcrumb
            component="a"
            href="#"
            label="Package"
            icon={<HomeIcon fontSize="small" />}
        ></StyledBreadcrumb>,
        <StyledBreadcrumb component="a" href="#" label="Type" />,
        <Typography key="3" color="text.primary">Object</Typography>,
    ];

    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
      setValue(newValue);
    };

    return (
        <ThemeProvider theme={darkTheme}>
            {/* <div className="app"> */}
            <Header pkg={statePkg} expGroup={stateExpGroup} exp={stateExp}></Header>

            <Breadcrumbs maxItems={2}
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
            >
                {breadcrumbs}
            </Breadcrumbs>
            <Box
                sx={{ flexGrow: 1,  display: 'flex', flex: 1, /*height: 224*/ height: "100%" }}
            >
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={value}
                    onChange={handleChange}
                    aria-label="Vertical tabs example"
                    sx={{ borderRight: 1, borderColor: 'divider' , height: "100%"}}
                >
                    <Tab label="Item One" {...a11yProps(0)} />
                    <Tab label="Item Two" {...a11yProps(1)} />
                    <Tab label="Item Three" {...a11yProps(2)} />
                    <Tab label="Item Four" {...a11yProps(3)} />
                    <Tab label="Item Five" {...a11yProps(4)} />
                    <Tab label="Item Six" {...a11yProps(5)} />
                    <Tab label="Item Seven" {...a11yProps(6)} />
                </Tabs>
                <TabPanel value={value} index={0}>
                    Item One
                </TabPanel>
                <TabPanel value={value} index={1}>
                    Item Two
                </TabPanel>
                <TabPanel value={value} index={2}>
                    Item Three
                </TabPanel>
                <TabPanel value={value} index={3}>
                    Item Four
                </TabPanel>
                <TabPanel value={value} index={4}>
                    Item Five
                </TabPanel>
                <TabPanel value={value} index={5}>
                    Item Six
                </TabPanel>
                <TabPanel value={value} index={6}>
                    Item Seven
                </TabPanel>
            </Box>
            {/* <ObjectInfo activeExp={stateExp[0]}></ObjectInfo>
            </div> */}
        </ThemeProvider>
    );
}

ipcRenderer.on("user-interaction-reply", onUserInteractionReply);

export default App;
export { App };