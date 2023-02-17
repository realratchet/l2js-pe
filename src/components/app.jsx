import "../../css/app.css";
import { Fragment, useState } from "react";
import { ipcRenderer } from "electron";

let pkg, setPkg;

async function onUserInteractionReply(_, { type, payload } = {}) {
    switch (type) {
        case "read-package": setPkg(payload); break;
        default: throw new Error(`Unsupported event type: ${type}`);
    }
}

function App() {
    const [pkgExps, setPkgExps] = useState([]);

    [pkg, setPkg] = useState();

    const groups = (pkg?.exports || []).reduce(function (acc, exp) {
        const container = acc[exp.type] = acc[exp.type] || [];

        container.push(exp);

        return acc;
    }, {});

    const groupKeys = Object.keys(groups), groupCount = groupKeys.length;
    const expCount = pkgExps.length;

    function onGroupChanged({ target: { value } }) { setPkgExps(groups[value]); }
    function onExportChanged({ target: { value } }) {
        ipcRenderer.send("user-interaction", {
            type: "load-export",
            payload: parseInt(value)
        });
    }

    if (pkg) {
        ipcRenderer.send("user-interaction", {
            type: "load-export",
            payload: 0
        });
    }

    return (
        <Fragment>
            <div className="app">
                <div>{pkg?.filename || "No file"}</div>
                <div className="dropdown-container">
                    <select disabled={groupCount === 0} onChange={onGroupChanged}>
                        <option disabled={true} defaultValue>-Nothing selected-</option>
                        {
                            groupKeys.map((gr, i) => (<option key={`group-dd-${i}`} value={gr}>{gr}</option>))
                        }
                    </select>
                </div>
                <div className="dropdown-container">
                    <select disabled={expCount === 0} onChange={onExportChanged}>
                        <option disabled={true} defaultValue>-Nothing selected-</option>
                        {
                            pkgExps.map((exp, i) => (<option key={`exp-dd-${i}`} value={exp.index}>{exp.name}</option>))
                        }
                    </select>
                </div>
                <input type="button" value="Open File" onClick={() => ipcRenderer.send("user-interaction", {
                    type: "read-package",
                    payload: { package: "17_25", type: "Level" }
                })}></input>
            </div>
        </Fragment>
    );
}

ipcRenderer.on("user-interaction-reply", onUserInteractionReply);

export default App;
export { App };