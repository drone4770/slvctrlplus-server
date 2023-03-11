import {Exclude} from "class-transformer";
import GenericVirtualDevice from "../generic/genericVirtualDevice.js";
import StrGenericDeviceAttribute from "../generic/strGenericDeviceAttribute.js";
import {GenericDeviceAttributeModifier} from "../generic/genericDeviceAttribute.js";
import EventEmitter from "events";

@Exclude()
export default class DisplayVirtualDevice extends GenericVirtualDevice
{

    public constructor(
        deviceId: string,
        deviceName: string,
        connectedSince: Date,
        controllable: boolean,
        eventEmitter: EventEmitter
    ) {
        super('10000', deviceId, deviceName, 'display', connectedSince, controllable, eventEmitter, [
            new StrGenericDeviceAttribute('html', GenericDeviceAttributeModifier.readWrite)
        ]);
    }

    public refreshData(): void {
        // no-op
    }
}
