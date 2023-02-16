import "react";
import { ipcRenderer } from "electron";
import "../../css/app.css";
import { Fragment } from "react";

function App() {
    return (
        <Fragment>
            <input type="button" value="Open File" onClick={() => ipcRenderer.send("user-interaction", {
                type: "read-package",
                payload: "maps/17_25.unr"
            })}></input>
        </Fragment>
    );
}

export default App;
export { App };