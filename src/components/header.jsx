import { ipcRenderer } from "electron";
import { Fragment, useState } from "react";

function Header({
    pkg: [activePkg, setPkg],
    expGroup: [activeExpGroup, setExpGroup],
    exp: [activeExp, setExp]
}) {
    const groups = (activePkg?.exports || []).reduce(function (acc, exp) {
        const container = acc[exp.type] = acc[exp.type] || [];

        container.push(exp);

        return acc;
    }, {});

    const groupKeys = Object.keys(groups), groupCount = groupKeys.length;
    const expCount = activeExpGroup !== "" ? groups[activeExpGroup].length : 0;

    function onGroupChanged({ target: { value } }) {
        setExpGroup(value);
        setExp("");
    }

    function onExportChanged({ target: { value } }) {
        ipcRenderer.send("user-interaction", {
            type: "load-export",
            payload: parseInt(value)
        });

        setExp(value);
    }

    return (
        <div className="header">
            <div>{activePkg?.filename || "No file"}</div>
            <div className="dropdown-container">
                <select value={activeExpGroup} disabled={groupCount === 0} onChange={onGroupChanged}>
                    <option disabled={true} value="">-Nothing selected-</option>
                    {
                        groupKeys.map((gr, i) => (<option key={`group-dd-${i}`} value={gr}>{gr}</option>))
                    }
                </select>
            </div>
            <div className="dropdown-container">
                <select value={activeExp} disabled={expCount === 0} onChange={onExportChanged}>
                    <option disabled={true} value="">-Nothing selected-</option>
                    {
                        activeExpGroup === ""
                            ? null
                            : groups[activeExpGroup]
                                .map((exp, i) => (
                                    <option
                                        key={`exp-dd-${i}`}
                                        value={exp.index}
                                    >{exp.name}</option>)
                                )
                    }
                </select>
            </div>
            <input type="button" value="Open File" onClick={() => ipcRenderer.send("user-interaction", {
                type: "read-package",
                payload: { package: "17_25", type: "Level" }
            })}></input>
        </div>
    );
}

export default Header;
export { Header };