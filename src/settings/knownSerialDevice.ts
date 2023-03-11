import {Exclude, Expose} from "class-transformer";

@Exclude()
export default class KnownSerialDevice
{
    @Expose()
    public id: string|undefined;

    @Expose()
    public serialNo: string|undefined;

    @Expose()
    public name: string|undefined;

    @Expose()
    public type: string|undefined;
}
