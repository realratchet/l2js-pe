import "../../css/app.css";
import Header from "./header.jsx";
import History from "./history.jsx";
import { ipcRenderer } from "electron";
import Editor from "./editor.jsx";
import { useState } from "react";
import { createTheme } from "@mui/material";
import { ThemeProvider } from "@emotion/react";

const darkTheme = createTheme({ palette: { mode: "dark" } });

function App() {
    const stateHistory = useState([]);
    const stateFilter = useState("");

    return (
        <ThemeProvider theme={darkTheme}>
            <Header filter={stateFilter} />
            <History history={stateHistory} />
            <Editor history={stateHistory} filter={stateFilter} />
        </ThemeProvider>
    );
}
export default App;
export { App };