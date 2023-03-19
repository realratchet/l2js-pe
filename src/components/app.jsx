import "../../css/app.css";
import { Header } from "./header.jsx";
import { ipcRenderer } from "electron";
import { Fragment, useState } from "react";

/**
 * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
 */
let statePkg;

async function onUserInteractionReply(_, { type, payload } = {}) {
    const [, setPkg] = statePkg;

    switch (type) {
        case "read-package": setPkg(payload); break;
        default: throw new Error(`Unsupported event type: ${type}`);
    }
}

function App() {
    const stateExpGroup = useState("");
    const stateExp = useState("");

    statePkg = useState("");

    return (
        <div className="app">
            <Header pkg={statePkg} expGroup={stateExpGroup} exp={stateExp}></Header>
        </div>
    );
}

ipcRenderer.on("user-interaction-reply", onUserInteractionReply);

export default App;
export { App };