import GenericSerialDevice from "../../device/generic/genericSerialDevice.js";
import ObjectDiscriminator from "./objectDiscriminator.js";

export default class DeviceDiscriminator extends ObjectDiscriminator {
    protected static discriminatorMap = [
        { value: GenericSerialDevice, name: 'generic' },
    ];
}
