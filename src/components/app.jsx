import "../../css/app.css";
import Header from "./header.jsx";
import History from "./history.jsx";
import { ipcRenderer } from "electron";
import Editor from "./editor.jsx";
import { useState } from "react";
import { createTheme, Divider } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import styled from "@emotion/styled";

const darkTheme = createTheme({ palette: { mode: "dark" } });

function App() {
    const stateHistory = useState([]);
    const stateFilter = useState("");

    return (
        <ThemeProvider theme={darkTheme}>
            <Header filter={stateFilter} history={stateHistory} />
            <History history={stateHistory} />
            <Divider />
            <Editor history={stateHistory} filter={stateFilter} />
        </ThemeProvider>
    );
}
export default App;
export { App };