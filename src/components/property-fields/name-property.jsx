import React from "react";
import { TextField } from "@mui/material";

export function NameProperty({ value }) {
    return <TextField label="name" variant="standard" value={value} disabled={true} />
}