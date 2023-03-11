import {Exclude, Expose} from "class-transformer";

@Exclude()
export default class ConfiguredVirtualDevice
{
    @Expose()
    public id: string|undefined;

    @Expose()
    public name: string|undefined;

    @Expose()
    public type: string|undefined;
}
