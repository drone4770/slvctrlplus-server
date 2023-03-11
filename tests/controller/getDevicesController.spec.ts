import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';
import ClassToPlainSerializer from '../../src/serialization/classToPlainSerializer';
import GetDevicesController from "../../src/controller/getDevicesController.js";
import GenericSerialDevice from "../../src/device/generic/genericSerialDevice.js";
import SynchronousSerialPort from "../../src/serial/SynchronousSerialPort.js";
import {PortInfo} from "@serialport/bindings-interface/dist/index.js";
import ConnectedDeviceRepository from "../../src/repository/connectedDeviceRepository.js";

describe('getDevicesController', () => {

    it('it returns all connected devices', async () => {

        const syncSerialPort = mock<SynchronousSerialPort>();
        const portInfo = mock<PortInfo>();

        const deviceUuid = 'foo-bar-baz';
        const device = new GenericSerialDevice('10000', deviceUuid, 'Aston Martin', 'et312', new Date(), syncSerialPort, portInfo, []);
        const serializedDevice = {
            fwVersion: '10000',
            deviceId: deviceUuid,
            deviceName: 'Aston Martin',
            deviceModel: 'et312',
        };
        const responseBody = {
            count: 1,
            items: [
                serializedDevice
            ]
        }

        const mockClassToPlainSerializer = mock<ClassToPlainSerializer>();
        mockClassToPlainSerializer.transform.calledWith(device).mockReturnValue(serializedDevice);

        const mockDeviceRepository = mock<ConnectedDeviceRepository>();
        mockDeviceRepository.getAll.calledWith().mockReturnValue([device]);

        const mockRequest = mock<Request>();

        const mockResponse = mock<Response>();
        mockResponse.status.calledWith(200).mockReturnValue(mockResponse);
        mockResponse.json.calledWith(responseBody).mockReturnValue(mockResponse);

        const controller = new GetDevicesController(
            mockDeviceRepository,
            mockClassToPlainSerializer,
        );

        controller.execute(mockRequest, mockResponse);

        expect(mockDeviceRepository.getAll).toHaveBeenCalledTimes(1);
        expect(mockClassToPlainSerializer.transform).toHaveBeenCalledTimes(1);
    });
});
