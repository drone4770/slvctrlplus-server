import {Exclude} from "class-transformer";
import Device from "./device.js";
import EventEmitter from "events";

@Exclude()
export default abstract class VirtualDevice extends Device
{
    protected readonly eventEmitter: EventEmitter;

    protected constructor(deviceId: string, deviceName: string, connectedSince: Date, controllable: boolean, eventEmitter: EventEmitter) {
        super(deviceId, deviceName, connectedSince, controllable);
        this.eventEmitter = eventEmitter;
    }

    public on(event: string, listener: (data: string) => void): this
    {
        this.eventEmitter.on(event, listener);

        return this;
    }

    public once(event: string, listener: (data: string) => void): this
    {
        this.eventEmitter.once(event, listener);

        return this;
    }

    public close(): void
    {
        this.eventEmitter.emit('close');
    }
}
