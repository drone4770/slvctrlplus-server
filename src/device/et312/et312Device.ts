import SynchronousSerialPort from "../../serial/SynchronousSerialPort.js";
import {Exclude, Expose} from "class-transformer";
import {PortInfo} from "@serialport/bindings-interface/dist/index.js";
import Et312DeviceData from "./et312DeviceData.js";
import SerialDevice from "../serialDevice.js";

@Exclude()
export default class Et312Device extends SerialDevice
{
    @Expose()
    private readonly fwVersion: string;

    @Expose()
    private data: Et312DeviceData;

    public constructor(
        fwVersion: string,
        deviceId: string,
        deviceName: string,
        connectedSince: Date,
        syncPort: SynchronousSerialPort,
        portInfo: PortInfo
    ) {
        super(deviceId, deviceName, connectedSince, syncPort, portInfo, true);

        this.fwVersion = fwVersion;
        this.data = new Et312DeviceData(false, true, 0, 0, 0);
    }

    public async setAdc(adc: boolean): Promise<void> {
        if (this.state === DeviceState.busy) {
            throw new Error(`Device ${this.deviceId} is currently busy`);
        }

        try {
            this.state = DeviceState.busy;

            const result = await this.syncPort.writeLineAndExpect(adc ? `adc-enable` : `adc-disable`);
            console.log(result)
            this.refreshData();
        } catch (err) {
            console.log(err);
        } finally {
            this.state = DeviceState.ready;
        }
    }

    public async setLevel(channel: string, level: number): Promise<void> {
        if (this.state === DeviceState.busy) {
            throw new Error(`Device ${this.deviceId} is currently busy`);
        }

        try {
            this.state = DeviceState.busy;

            const result = await this.syncPort.writeLineAndExpect(`level-set ${channel} ${level}`);
            console.log(result)
            this.refreshData();
        } catch (err) {
            console.log(err);
        } finally {
            this.state = DeviceState.ready;
        }
    }

    public async setMode(mode: number): Promise<void> {
        if (this.state === DeviceState.busy) {
            throw new Error(`Device ${this.deviceId} is currently busy`);
        }

        try {
            this.state = DeviceState.busy;

            const result = await this.syncPort.writeLineAndExpect(`mode-set ${mode}`);
            console.log(result)
            this.refreshData();
        } catch (err) {
            console.log(err);
        } finally {
            this.state = DeviceState.ready;
        }
    }

    public refreshData(): void
    {
        this.syncPort.writeLineAndExpect('status').then((data) => {
            const dataObj = this.parseDataStr(data);

            if (null === dataObj) {
                return;
            }

            const deviceData = {...{
                connected: '0',
                adc: '1',
                levelA: '0',
                levelB: '0',
                mode: '0',
            }, ...dataObj};

            this.data = new Et312DeviceData(
                deviceData.connected === '1',
                deviceData.adc === '1',
                Number(deviceData.mode),
                Number(deviceData.levelA),
                Number(deviceData.levelB)
            )
        }).catch(console.log);
    }

    private parseDataStr(data: string): { [key: string]: string }|null {
        const dataParts: string[] = data.split(',');

        if ('status' !== dataParts.shift()) {
            return null;
        }

        const dataObj: { [key: string]: string } = {};

        for (const dataPart of dataParts) {
            const [key, value]: string[] = dataPart.split(':');
            dataObj[key] = value;
        }

        return dataObj;
    }
}
