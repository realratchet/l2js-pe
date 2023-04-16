import "../../css/app.css";
import Header from "./header.jsx";
import History from "./history.jsx";
import { ipcRenderer } from "electron";
import Editor from "./editor.jsx";
import { Fragment, useReducer, useState } from "react";
import { createTheme } from "@mui/material";
import { ThemeProvider } from "@emotion/react";

const darkTheme = createTheme({ palette: { mode: "dark" } });

function histReducer(state, { type, payload }) {
    switch (type) {
        case "push": state.push(payload); break;
        default: throw new Error(`Unsupported action: '${type}'`);
    }

    return state.slice();
}

function App() {
    const stateHistory = useReducer(histReducer, []);
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