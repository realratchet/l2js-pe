import React, { useState } from "react";
import { MenuItem, Select } from "@mui/material";

function BooleanProperty({ value }) {
    const [curValue, setCurValue] = useState(value);

    function handleChange({ target: { value } }) {
        setCurValue(value);
    }

    return (
        <Select value={curValue} label="boolean" onChange={handleChange}>
            <MenuItem value={false}>False</MenuItem>
            <MenuItem value={true}>True</MenuItem>
        </Select>
    );
}

export default BooleanProperty;
export { BooleanProperty };