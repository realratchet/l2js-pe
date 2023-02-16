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