import React from "react";
import IntProperty from "./int-property.jsx";

function Int32Property({ value, object, isSet, isDefault, propertyName, index }) {
    return <IntProperty
        isSet={isSet}
        isDefault={isDefault}
        object={object}
        propertyName={propertyName}
        index={index}
        value={value}
        label="int32"
        min={-2147483648}
        max={2147483647} />
}

export default Int32Property;
export { Int32Property };