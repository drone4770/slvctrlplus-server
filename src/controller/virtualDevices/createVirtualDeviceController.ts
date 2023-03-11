import { Request, Response } from 'express';
import ControllerInterface from "../controllerInterface.js";
import Settings from "../../settings/settings.js";
import UuidFactory from "../../factory/uuidFactory.js";
import ConfiguredVirtualDevice from "../../settings/configuredVirtualDevice.js";
import Schema from "validate";

export default class CreateVirtualDeviceController implements ControllerInterface
{

    private readonly uuidFactory: UuidFactory;

    private readonly settings: Settings;

    public constructor(
        uuidFactory: UuidFactory,
        settings: Settings
    ) {
        this.uuidFactory = uuidFactory;
        this.settings = settings;
    }

    public execute(req: Request, res: Response): void
    {
        if(!req.is('application/json')) {
            res.status(406).send('Content-Type header must be application/json');
            return;
        }

        const deviceType = 'display';
        const deviceName = 'Fluffy chewbacca'

        const deviceConfig = new ConfiguredVirtualDevice()

        const body = req.body as Partial<ConfiguredVirtualDevice>

        deviceConfig.id = this.uuidFactory.create();
        deviceConfig.name = deviceName;
        deviceConfig.type = deviceType;

        // this.settings.getConfiguredVirtualDevices().set(deviceConfig.id, deviceConfig);

        res.header('Content-Type', 'application/json').status(201).json(deviceConfig);
    }
}
