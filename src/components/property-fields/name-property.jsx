import React from "react";
import { TextField } from "@mui/material";

function NameProperty({ value }) {
    return <TextField label="name" variant="standard" value={value} disabled={true} />
}

export default NameProperty;
export { NameProperty };