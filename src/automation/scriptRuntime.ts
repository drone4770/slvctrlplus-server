import {NodeVM, VMScript} from "vm2";
import Device from "../device/device.js";
import DeviceRepositoryInterface from "../repository/deviceRepositoryInterface.js";
import DeviceEventType from "../device/deviceEventType.js";
import fs, {WriteStream} from "fs";
import readLastLines from "read-last-lines/dist/index.js";
import EventEmitter from "events";
import AutomationEventType from "./automationEventType.js";

type DeviceEvent = { type: string|null, device: Device|null }
type Sandbox = {
    devices: DeviceRepositoryInterface,
    event: DeviceEvent
    context: { [key: string]: string }
}

export declare interface ScriptRuntime {
    on(event: AutomationEventType.consoleLog, listener: (data: string) => void): this;
    on(event: AutomationEventType.scriptStarted | AutomationEventType.scriptStopped, listener: () => void): this;
}

export class ScriptRuntime extends EventEmitter
{

    private scriptCode: VMScript |null = null;

    private vm: NodeVM | null  = null;

    private sandbox: Sandbox | null = null;

    private readonly deviceRepository: DeviceRepositoryInterface;

    private readonly logPath: string;

    private logWriter: WriteStream | undefined;

    private runningSince: Date | null = null;

    public constructor(deviceRepository: DeviceRepositoryInterface, logPath: string) {
        super();
        this.deviceRepository = deviceRepository;
        this.logPath = logPath;
    }

    public load(scriptCode: string): void
    {
        this.scriptCode = new VMScript(scriptCode);

        this.sandbox = {
            event: { type: null, device: null },
            devices: this.deviceRepository,
            context: {},
        }

        this.vm = new NodeVM({
            console: 'redirect',
            require: {
                external: true,
                root: './',
            },
            sandbox: this.sandbox
        });

        this.logWriter = fs.createWriteStream(`${this.logPath}/automation.log`)

        this.vm.on('console.log', (data: string) => {
            console.log(`VM stdout: ${data}`);
            void this.log(data);
            this.emit(AutomationEventType.consoleLog, data);
        });

        this.runningSince = new Date();

        this.emit(AutomationEventType.scriptStarted);
        console.log('script loaded')
    }

    public stop(): void
    {
        this.vm = null;
        this.sandbox = null;
        this.runningSince = null;

        if (this.logWriter) {
            this.logWriter.close();
        }

        this.emit(AutomationEventType.scriptStopped);
        console.log('script stopped')
    }

    public runForEvent(eventType: DeviceEventType, device: Device): void
    {
        if (null === this.vm || null === this.scriptCode) {
            return;
        }

        if (null !== this.sandbox) {
            this.sandbox.event.type = eventType;
            this.sandbox.event.device = device;
        }

        try {
            this.vm.run(this.scriptCode);
        } catch (e: unknown) {
            const msg = (e as Error).message;
            console.error(`VM stdout: ${msg}`);
            void this.log(msg);
            this.emit(AutomationEventType.consoleLog, (e as Error).toString());
        }
    }

    public async getLog(maxLines: number): Promise<string>
    {
        return readLastLines.read(`${this.logPath}/automation.log`, maxLines);
    }

    public isRunning(): boolean
    {
        return null !== this.runningSince;
    }

    public getRunningSince(): Date|null
    {
        return this.runningSince;
    }

    private log(data: string): void
    {
        if (!this.logWriter) {
            return;
        }

        this.logWriter.write(`${data}\n`);
    }
}

export default ScriptRuntime;
