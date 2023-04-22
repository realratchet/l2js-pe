import React from "react";
import IntProperty from "./int-property.jsx";

function Uint8Property({ value, object, isSet, isDefault, propertyName, index }) {
    return <IntProperty
        isSet={isSet}
        isDefault={isDefault}
        object={object}
        propertyName={propertyName}
        index={index}
        value={value}
        label="uint8"
        min={0}
        max={255}
        radix={16} />
}

export default Uint8Property;
export { Uint8Property };