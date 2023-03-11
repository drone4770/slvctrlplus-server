import SynchronousSerialPort from "../serial/SynchronousSerialPort.js";
import {PortInfo} from "@serialport/bindings-interface/dist/index.js";
import {Exclude} from "class-transformer";
import Device from "./device.js";

@Exclude()
export default abstract class SerialDevice extends Device
{
    protected readonly portInfo: PortInfo;
    protected readonly syncPort: SynchronousSerialPort;

    protected constructor(
        deviceId: string,
        deviceName: string,
        connectedSince: Date,
        syncPort: SynchronousSerialPort,
        portInfo: PortInfo,
        controllable: boolean
    ) {
        super(deviceId, deviceName, connectedSince, controllable);
        this.syncPort = syncPort;
        this.portInfo = portInfo;
    }

    public get getPortInfo(): PortInfo
    {
        return this.portInfo;
    }

    protected parseDataStr(data: string): { [key: string]: string }|null {
        const dataParts: string[] = data.split(';');

        if (dataParts.length < 2 || 'status' !== dataParts[0]) {
            return null;
        }

        const dataObj: { [key: string]: string } = {};

        for (const dataPart of dataParts[1].split(',')) {
            const [key, value]: string[] = dataPart.split(':');

            dataObj[key] = value;
        }

        return dataObj;
    }

    protected getSerialTimeout(): number {
        return 0;
    }

    protected async send(command: string): Promise<string> {
        return await this.syncPort.writeLineAndExpect(command, this.getSerialTimeout());
    }
}
