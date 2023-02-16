import "react";
import { ipcRenderer } from "electron";
import "../../css/app.css";
import { Fragment } from "react";

function App() {
    return (
        <Fragment>
            <input type="button" value="Open File" onClick={() => ipcRenderer.send("user-interaction", { type: "open-file" })}></input>
        </Fragment>
    );
}

export default App;
export { App };