import React from "react";
import { TextField } from "@mui/material";

export function StringProperty({ value, encoding = "ascii" }) {
    return <TextField label="string" variant="standard" value={value} />
}