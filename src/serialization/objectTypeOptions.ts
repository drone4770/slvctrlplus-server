import {TypeOptions} from "class-transformer";
import GenericSerialDevice from "../device/generic/genericSerialDevice.js";

export default class ObjectTypeOptions
{
    public static readonly device: TypeOptions = {
        discriminator: {
            property: 'type',
            subTypes: [
                { value: GenericSerialDevice, name: 'generic' },
            ]
        },
    };
}
