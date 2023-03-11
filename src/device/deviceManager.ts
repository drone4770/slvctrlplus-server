import {ReadlineParser, ReadyParser, SerialPort} from "serialport";
import SynchronousSerialPort from "../serial/SynchronousSerialPort.js";
import SerialDeviceFactory from "./serialDeviceFactory.js";
import {PortInfo} from "@serialport/bindings-interface/dist/index.js";
import Device from "./device.js";
import EventEmitter from "events";
import DeviceState from "./deviceState.js";
import VirtualDeviceFactory from "./virtualDeviceFactory.js";

export default class DeviceManager extends EventEmitter
{
    private static readonly moduleReadyByte = 0x07;

    private connectedDevices: Map<string, Device> = new Map();
    private managedDevices: Map<string, null> = new Map();

    private readonly serialDeviceFactory: SerialDeviceFactory;
    private readonly virtualDeviceFactory: VirtualDeviceFactory;

    public constructor(deviceFactory: SerialDeviceFactory, virtualDeviceFactory: VirtualDeviceFactory) {
        super();
        this.serialDeviceFactory = deviceFactory;
        this.virtualDeviceFactory = virtualDeviceFactory;
    }

    public async discoverSerialDevices(): Promise<void> {
        const foundDevices: Map<string, null> = new Map();

        try {
            const ports = await SerialPort.list();

            for (const portInfo of ports) {
                if (undefined === portInfo.serialNumber || '' === portInfo.serialNumber) {
                    continue;
                }

                foundDevices.set(portInfo.serialNumber, null);

                if (!this.managedDevices.has(portInfo.serialNumber)) {
                    this.managedDevices.set(portInfo.serialNumber, null);
                    console.log('Managed devices: ' + this.managedDevices.size.toString());

                    this.addSerialDevice(portInfo);
                }
            }

            for (const [key] of this.managedDevices) {
                if (!foundDevices.has(key)) {
                    this.managedDevices.delete(key);
                    console.log('Managed devices: ' + this.managedDevices.size.toString());
                }
            }
        } catch (err) {
            console.log('Could not list serial ports: ' + (err as Error).message);
        }
    }

    public addVirtualDevice(deviceId: string, deviceType: string, deviceName: string): void {
        this.connectVirtualDevice(deviceId, deviceType, deviceName).catch(console.log);
    }

    public addSerialDevice(portInfo: PortInfo): void {
        if (portInfo.vendorId === '2341') {
            // It's an arduino
            this.addArduinoSerialDevice(portInfo);
        } else {
            // It's something else
            this.addOtherSerialDevice(portInfo);
        }
    }

    private addOtherSerialDevice(portInfo: PortInfo): void
    {
        const port = new SerialPort({path: portInfo.path, baudRate: 9600, autoOpen: false });
        port.on('error', err => console.log(err));

        // Generic usb-serial device code
        port.open((err: Error|null) => {
            if (null !== err) {
                console.log('Error in communication with device ' + portInfo.path + ': ' + err.message);
                return;
            }

            console.log('Connection opened for device: ' + portInfo.path);
            this.connectSerialDevice(port, portInfo).catch(console.log);
        });
    }

    private addArduinoSerialDevice(portInfo: PortInfo): void
    {
        const port = new SerialPort({path: portInfo.path, baudRate: 9600, autoOpen: false });
        const readyParser = port.pipe(new ReadyParser({delimiter: [DeviceManager.moduleReadyByte]}));

        port.on('error', err => console.log(err));

        // slvCtrl specific code (device type detection, etc)
        const readyHandler = () => {
            console.log('Received ready bytes from serial device');
            readyParser.removeListener('ready', readyHandler);
            port.unpipe(readyParser);

            this.connectSerialDevice(port, portInfo).catch(console.log);
        };

        readyParser.on('ready', readyHandler);

        // Generic usb-serial device code
        port.open((err: Error|null) => {
            if (null !== err) {
                console.log('Error in communication with device ' + portInfo.path + ': ' + err.message);
                return;
            }

            console.log('Connection opened for device: ' + portInfo.path);
        });
    }

    private async connectSerialDevice(port: SerialPort, portInfo: PortInfo): Promise<void>
    {
        const parser = port.pipe(new ReadlineParser({delimiter: '\n'}));
        const syncPort = new SynchronousSerialPort(parser, port);

        console.log('Ask device for introduction');
        await syncPort.writeLineAndExpect('clear', 0);
        const result = await syncPort.writeLineAndExpect('introduce', 0);
        console.log('Module detected: ' + result);

        const device = await this.serialDeviceFactory.create(result, syncPort, portInfo);

        if (null === device) {
            return;
        }

        const deviceStatusUpdater = () => {
            if (device.getState === DeviceState.busy) {
                return;
            }
            device.refreshData();
            this.emit('deviceRefreshed', device);
        };

        deviceStatusUpdater();

        const deviceStatusUpdaterInterval = setInterval(deviceStatusUpdater, device.getRefreshInterval);

        this.connectedDevices.set(device.getDeviceId, device);

        this.emit('deviceConnected', device);

        console.log('Path: ' + portInfo.path);
        console.log('Manufacturer: ' + portInfo.manufacturer);
        console.log('Serial no.: ' + portInfo.serialNumber);
        console.log('Location ID: ' + portInfo.locationId);
        console.log('Product ID: ' + portInfo.productId);
        console.log('Vendor ID: ' + portInfo.vendorId);
        console.log('pnp ID: ' + portInfo.pnpId);

        console.log('Assigned device id: ' + device.getDeviceId);
        console.log('Connected devices: ' + this.connectedDevices.size.toString());

        port.on('close', () => {
            clearInterval(deviceStatusUpdaterInterval);
            this.connectedDevices.delete(device.getDeviceId);

            this.emit('deviceDisconnected', device);

            console.log('Lost device: ' + device.getDeviceId);
            console.log('Connected devices: ' + this.connectedDevices.size.toString());
        });
    }

    private async connectVirtualDevice(deviceId: string, deviceType: string, deviceName: string): Promise<void>
    {

        const device = await this.virtualDeviceFactory.create(deviceId, deviceType, deviceName);

        if (null === device) {
            return;
        }

        const deviceStatusUpdater = () => {
            if (device.getState === DeviceState.busy) {
                return;
            }
            device.refreshData();
            this.emit('deviceRefreshed', device);
        };

        deviceStatusUpdater();

        const deviceStatusUpdaterInterval = setInterval(deviceStatusUpdater, device.getRefreshInterval);

        this.connectedDevices.set(device.getDeviceId, device);

        this.emit('deviceConnected', device);

        console.log('Assigned device id: ' + device.getDeviceId);
        console.log('Connected devices: ' + this.connectedDevices.size.toString());

        device.on('close', () => {
            clearInterval(deviceStatusUpdaterInterval);
            this.connectedDevices.delete(device.getDeviceId);

            this.emit('deviceDisconnected', device);

            console.log('Lost device: ' + device.getDeviceId);
            console.log('Connected devices: ' + this.connectedDevices.size.toString());
        });
    }

    public getConnectedDevices(): Device[]
    {
        return Array.from(this.connectedDevices.values());
    }

    public getConnectedDevice(uuid: string): Device|null
    {
        const device = this.connectedDevices.get(uuid);

        return undefined !== device ? device : null;
    }
}
