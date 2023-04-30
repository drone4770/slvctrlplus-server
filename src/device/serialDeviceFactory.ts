import SynchronousSerialPort from "../serial/SynchronousSerialPort.js";
import UuidFactory from "../factory/uuidFactory.js";
import {PortInfo} from "@serialport/bindings-interface/dist/index.js";
import Settings from "../settings/settings.js";
import KnownSerialDevice from "../settings/knownSerialDevice.js";
import Device from "./device.js";
import DeviceNameGenerator from "./deviceNameGenerator.js";
import GenericSerialDevice from "./generic/genericSerialDevice.js";
import GenericDeviceAttribute, {GenericDeviceAttributeModifier} from "./generic/genericDeviceAttribute.js";
import BoolGenericDeviceAttribute from "./generic/boolGenericDeviceAttribute.js";
import FloatGenericDeviceAttribute from "./generic/floatGenericDeviceAttribute.js";
import StrGenericDeviceAttribute from "./generic/strGenericDeviceAttribute.js";
import RangeGenericDeviceAttribute from "./generic/rangeGenericDeviceAttribute.js";
import ListGenericDeviceAttribute from "./generic/listGenericDeviceAttribute.js";
import IntGenericDeviceAttribute from "./generic/intGenericDeviceAttribute.js";

export default class SerialDeviceFactory
{
    private readonly uuidFactory: UuidFactory;

    private readonly settings: Settings;

    private readonly nameGenerator: DeviceNameGenerator;

    public constructor(uuidFactory: UuidFactory, settings: Settings, nameGenerator: DeviceNameGenerator) {
        this.uuidFactory = uuidFactory;
        this.settings = settings;
        this.nameGenerator = nameGenerator;
    }

    public async create(deviceInfoStr: string, syncPort: SynchronousSerialPort, portInfo: PortInfo): Promise<Device> {
        if (undefined === portInfo.serialNumber) {
            throw new Error(`Serial number of this device is unknown`);
        }

        const [deviceType, deviceVersion, protocolVersion] = deviceInfoStr.split(';')[1].split(',');

        const knownDevice = this.createKnownDevice(portInfo.serialNumber, deviceType);

        if (undefined === knownDevice.id || undefined === knownDevice.name) {
            throw new Error(`Id and/or name are unknown for device with serial no. '${portInfo.serialNumber}'`);
        }

        const deviceAttrResponse = await syncPort.writeLineAndExpect('attributes');
        const deviceAttrs = SerialDeviceFactory.parseDeviceAttributes(deviceAttrResponse);

        const device = new GenericSerialDevice(
            deviceVersion,
            knownDevice.id,
            knownDevice.name,
            deviceType,
            new Date(),
            syncPort,
            Number(protocolVersion),
            portInfo,
            deviceAttrs
        );

        if (null === device) {
            throw new Error(`Unknown device type: ${deviceType}`);
        }

        this.settings.getKnownSerialDevices().set(portInfo.serialNumber, knownDevice);

        return device;
    }

    private static parseDeviceAttributes(response: string): GenericDeviceAttribute[] {
        // attributes;connected:ro[bool],adc:rw[bool],mode:rw[118-140],levelA:rw[0-99],levelB:rw[0-99]
        const responseParts = response.split(';');
        const attributeList = [];

        if (undefined === responseParts || responseParts.length !== 2 || 'attributes' !== responseParts[0]) {
            throw new Error(`Invalid response format for parsing attributes: ${response}`);
        }

        for (const attr of responseParts[1].split(',')) {
            const attrParts = attr.split(':');

            attributeList.push(this.createAttributeFromValue(attrParts[0], attrParts[1]));
        }

        return attributeList;
    }

    private static createAttributeFromValue(name: string, definition: string): GenericDeviceAttribute {
        const re = /^(ro|rw|wo)\[(.+?)\]$/;
        const reRange = /^(\d+)-(\d+)$/;
        const reResult = re.exec(definition);
        if (null === reResult || 3 !== reResult.length) {
            throw new Error(`Could not parse definition '${definition}' for attribute with name '${name}'`);
        }
        const type = reResult[1];
        const value = reResult[2];
        let result: RegExpExecArray|null;
        let resultList: string[];

        const modifier = this.getAttributeTypeFromStr(type);

        let attr = null;

        if ('bool' === value) {
            attr = new BoolGenericDeviceAttribute(name, modifier);
        } else if ('int' === value) {
            attr = new IntGenericDeviceAttribute(name, modifier);
        } else if ('float' === value) {
            attr = new FloatGenericDeviceAttribute(name, modifier);
        } else if ('str' === value) {
            attr = new StrGenericDeviceAttribute(name, modifier);
        } else if (null !== (result = reRange.exec(value))) {
            attr = new RangeGenericDeviceAttribute(name, modifier);
            attr.min = Number(result[1]);
            attr.max = Number(result[2]);
        } else if ((resultList = value.split('|')).length > 0) {
            attr = new ListGenericDeviceAttribute(name, modifier);
            attr.values = resultList;
        } else {
            throw new Error(`Unknown attribute data type: ${value}`);
        }

        return attr;
    }

    private static getAttributeTypeFromStr(type: string): GenericDeviceAttributeModifier {
        if ('ro' === type) {
            return GenericDeviceAttributeModifier.readOnly;
        } else if ('rw' === type) {
            return GenericDeviceAttributeModifier.readWrite;
        } else if ('wo' === type) {
            return GenericDeviceAttributeModifier.writeOnly;
        }

        throw new Error(`Unknown attribute type: ${type}`);
    }

    private createKnownDevice(serialNo: string, deviceType: string): KnownSerialDevice {
        const knownDevice = this.settings.getKnownSerialDevices().get(serialNo);

        if (undefined !== knownDevice) {
            return knownDevice;
        }

        const newDevice = new KnownSerialDevice();

        newDevice.id = this.uuidFactory.create();
        newDevice.serialNo = serialNo;
        newDevice.name = this.nameGenerator.generateName();
        newDevice.type = deviceType;

        return newDevice;
    }
}
