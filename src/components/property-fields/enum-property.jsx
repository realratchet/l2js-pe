import React, { useState } from "react";
import { MenuItem, Select } from "@mui/material";

function EnumProperty({ value, enumName, names }) {
    const [curValue, setCurValue] = useState(value);

    function handleChange({ target: { value } }) {
        setCurValue(value);
    }

    return (
        <Select value={curValue} label={enumName} onChange={handleChange}>
            {
                names.map((name, index) => <MenuItem key={index} value={index}>{name}</MenuItem>)
            }
        </Select>
    );
}

export default EnumProperty;
export { EnumProperty };