import "../../css/app.css";
import Header from "./header.jsx";
import History from "./history.jsx";
import { ipcRenderer } from "electron";
import ObjectInfo from "./object-info.jsx";
import { Fragment, useState } from "react";
import { createTheme } from "@mui/material";
import { ThemeProvider } from "@emotion/react";

const darkTheme = createTheme({ palette: { mode: "dark" } });

/**
 * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
 */
let statePkg;



function App() {
    const stateExpGroup = useState("");
    const stateExp = useState("");
    const stateHistory = useState([]);

    statePkg = useState("");


    return (
        <ThemeProvider theme={darkTheme}>
            <Header pkg={statePkg} expGroup={stateExpGroup} exp={stateExp} />
            <History history={stateHistory} />
            <ObjectInfo pkg={statePkg} />
        </ThemeProvider>
    );
}
export default App;
export { App };

async function onUserInteractionReply(_, { type, payload } = {}) {
    const [, setPkg] = statePkg;

    switch (type) {
        case "read-package": setPkg(payload); break;
        case "load-export": break;
        default: throw new Error(`Unsupported event type: ${type}`);
    }
}

ipcRenderer.on("user-interaction-reply", onUserInteractionReply);
