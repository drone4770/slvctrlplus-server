import {Exclude, Expose, Type} from "class-transformer";
import VirtualDevice from "../virtualDevice.js";
import GenericDeviceAttribute from "./genericDeviceAttribute.js";
import GenericDeviceAttributeDiscriminator
    from "../../serialization/discriminator/genericDeviceAttributeDiscriminator.js";
import DeviceState from "../deviceState.js";
import EventEmitter from "events";

@Exclude()
export default class GenericVirtualDevice extends VirtualDevice
{

    @Expose()
    private deviceModel: string;

    @Expose()
    @Type(() => GenericDeviceAttribute, GenericDeviceAttributeDiscriminator.createClassTransformerTypeDiscriminator('type'))
    private readonly attributes: GenericDeviceAttribute[];

    @Expose()
    private data: JsonObject = {};

    @Expose()
    private readonly fwVersion: string;

    public constructor(
        fwVersion: string,
        deviceId: string,
        deviceName: string,
        deviceModel: string,
        connectedSince: Date,
        controllable: boolean,
        eventEmitter: EventEmitter,
        attributes: GenericDeviceAttribute[]
    ) {
        super(deviceId, deviceName, connectedSince, controllable, eventEmitter);

        this.fwVersion = fwVersion;
        this.deviceModel = deviceModel;
        this.attributes = attributes;
    }

    public refreshData(): void {
        // no-op
    }

    public async setAttribute(attributeName: string, value: string|number|boolean|null): Promise<string> {
        try {
            this.state = DeviceState.busy;

            if (value === true || value === false) {
                value = value ? 1 : 0;
            }

            return new Promise(() => {
                if (null === this.getAttributeDefinition(attributeName)) {
                    throw new Error(`Unknown attribute '${attributeName}'`);
                }

                this.data[attributeName] = value;

                return value;
            });
        } finally {
            this.state = DeviceState.ready;
        }
    }

    public getAttribute(key: string): any
    {
        return this.data[key];
    }

    public getAttributeDefinitions(): GenericDeviceAttribute[]
    {
        return this.attributes;
    }

    public getAttributeDefinition(name: string): GenericDeviceAttribute|null
    {
        for (const attr of this.attributes) {
            if (attr.name === name) {
                return attr;
            }
        }

        return null;
    }

    public get getRefreshInterval(): number {
        return 175;
    }
}
