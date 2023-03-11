import {Exclude, Expose} from "class-transformer";

export enum GenericDeviceAttributeModifier {
    readOnly = "ro",
    readWrite = "rw",
    writeOnly = "ro"
}

@Exclude()
export default abstract class GenericDeviceAttribute {
    @Expose()
    public type: string | undefined; // This field is only here to expose it explicitly

    @Expose()
    public name: string;

    @Expose()
    public modifier: GenericDeviceAttributeModifier;

    public constructor(name: string, modifier: GenericDeviceAttributeModifier) {
        this.name = name;
        this.modifier = modifier;
    }

    public fromString(value: string): string|number|boolean
    {
        return value;
    }
}
