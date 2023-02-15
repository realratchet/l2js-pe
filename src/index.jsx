import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/app.jsx";
import ReactDOM from "react-dom/client";

const root = document.createElement("div");

root.id = "root";

document.body.appendChild(root);

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>
);