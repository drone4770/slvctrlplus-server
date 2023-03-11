import { Request, Response } from 'express';
import ControllerInterface from "../controllerInterface.js";
import Settings from "../../settings/settings.js";
import UuidFactory from "../../factory/uuidFactory.js";
import ConfiguredVirtualDevice from "../../settings/configuredVirtualDevice.js";
import Ajv, {JSONSchemaType, Schema} from "ajv";

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

        const schema = {
            type: "object",
            properties: {
                name: {type: "string", minLength: 3, nullable: false},
                type: {type: "string", enum: ["display"], nullable: false }
            },
            required: ["name", "type"],
            additionalProperties: false,
        };

        const body = req.body as Partial<ConfiguredVirtualDevice>

        const validator = new Ajv({allErrors: true});

        const valid = validator.validate(schema, body);

        if (!valid) {
            res.header('Content-Type', 'application/json').status(400).json(validator.errors);
            return;
        }

        const deviceConfig = new ConfiguredVirtualDevice()

        deviceConfig.id = this.uuidFactory.create();
        deviceConfig.name = body.name;
        deviceConfig.type = body.type;

        this.settings.getConfiguredVirtualDevices().set(deviceConfig.id, deviceConfig);

        res.header('Content-Type', 'application/json').status(201).json(deviceConfig);
    }
}
