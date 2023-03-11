import { Pimple, ServiceProvider } from '@timesplinter/pimple';
import DeviceManager from "../device/deviceManager.js";
import SerialDeviceFactory from "../device/serialDeviceFactory.js";
import DelegateDeviceUpdater from "../device/delegateDeviceUpdater.js";
import PlainToClassSerializer from "../serialization/plainToClassSerializer.js";
import UuidFactory from "../factory/uuidFactory.js";
import Settings from "../settings/settings.js";
import {adjectives, Config} from "unique-names-generator";
import DeviceNameGenerator from "../device/deviceNameGenerator.js";
import DeviceUpdaterInterface from "../device/deviceUpdaterInterface.js";
import {starWarsNouns} from "../util/dictionary.js";
import BufferedDeviceUpdater from "../device/bufferedDeviceUpdater.js";
import GenericDeviceUpdater from "../device/generic/genericDeviceUpdater.js";
import GenericSerialDevice from "../device/generic/genericSerialDevice.js";
import VirtualDeviceFactory from "../device/virtualDeviceFactory.js";

export default class DeviceServiceProvider implements ServiceProvider
{
    public register(container: Pimple): void {
        container.set('device.manager', (): DeviceManager => {
            return new DeviceManager(
                container.get('device.factory.serial') as SerialDeviceFactory,
                container.get('device.factory.virtual') as VirtualDeviceFactory,
            );
        });

        container.set('device.uniqueNameGenerator', (): DeviceNameGenerator => {
            const config: Config = {
                dictionaries: [adjectives, starWarsNouns],
                length: 2,
                separator: ' ',
                style: 'capital'
            };

            return new DeviceNameGenerator(config);
        })

        container.set('device.factory.serial', () => new SerialDeviceFactory(
            container.get('factory.uuid') as UuidFactory,
            container.get('settings') as Settings,
            container.get('device.uniqueNameGenerator') as DeviceNameGenerator,
        ));

        container.set('device.factory.virtual', () => new VirtualDeviceFactory(
            container.get('factory.uuid') as UuidFactory,
            container.get('settings') as Settings,
        ));

        container.set('device.updater', (): DeviceUpdaterInterface => {
            const plainToClass  = container.get('serializer.plainToClass') as PlainToClassSerializer;
            const deviceUpdater = new DelegateDeviceUpdater();

            deviceUpdater.add(GenericSerialDevice, new GenericDeviceUpdater(plainToClass));

            return new BufferedDeviceUpdater(deviceUpdater);
        });
    }
}
