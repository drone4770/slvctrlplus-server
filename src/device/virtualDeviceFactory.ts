import UuidFactory from "../factory/uuidFactory.js";
import Settings from "../settings/settings.js";
import DisplayVirtualDevice from "./virtual/displayVirtualDevice.js";
import VirtualDevice from "./virtualDevice.js";
import EventEmitter from "events";

export default class VirtualDeviceFactory
{
    private readonly uuidFactory: UuidFactory;

    private readonly settings: Settings;

    public constructor(uuidFactory: UuidFactory, settings: Settings) {
        this.uuidFactory = uuidFactory;
        this.settings = settings;
    }

    public async create(deviceId: string, deviceType: string, deviceName: string): Promise<VirtualDevice|null>
    {
        return new Promise(() => {
            let device = null;

            if ('display' === deviceType) {
                device = new DisplayVirtualDevice(
                    deviceId,
                    deviceName,
                    new Date(),
                    false,
                    new EventEmitter()
                );
            }

            if (null === device) {
                throw new Error('Unknown device type: ' + deviceType);
            }

            return device;
        });
    }
}
