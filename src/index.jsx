import { ipcRenderer } from "electron";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/app.jsx";

const root = document.createElement("div");

root.id = "root";

document.body.appendChild(root);
document.title = "Lineage2JS - Property Editor";

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>
);


// window.addEventListener("DOMContentLoaded", async function () {
//     setTimeout(function () {
//         ipcRenderer.send("user-interaction", {
//             type: "read-package",
//             payload: { package: "17_25", type: "Level" }
//         });
//     }, 500); // small delay because the debugger within electron takes some time to attach
// });