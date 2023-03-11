import 'dotenv/config';
import 'reflect-metadata';
import cors from 'cors';
import contentTypeMiddleware from './middleware/contentTypeMiddleware.js';
import express from 'express';
import { Pimple } from '@timesplinter/pimple';
import ControllerServiceProvider from './serviceProvider/controllerServiceProvider.js';
import RepositoryServiceProvider from './serviceProvider/repositoryServiceProvider.js';
import SerializationServiceProvider from './serviceProvider/serializationServiceProvider.js';
import FactoryServiceProvider from './serviceProvider/factoryServiceProvider.js';
import DeviceManager from "./device/deviceManager.js";
import DeviceServiceProvider from "./serviceProvider/deviceServiceProvider.js";
import SettingsServiceProvider from "./serviceProvider/settingsServiceProvider.js";
import {Server} from "socket.io";
import * as http from 'http'
import SocketServiceProvider from "./serviceProvider/socketServiceProvider.js";
import DeviceUpdateHandler from "./socket/deviceUpdateHandler.js";
import ObjectTypeOptions from "./serialization/objectTypeOptions.js";
import ClassToPlainSerializer from "./serialization/classToPlainSerializer.js";
import {DeviceUpdateData} from "./socket/types";
import AutomationServiceProvider from "./serviceProvider/automationServiceProvider.js";
import ScriptRuntime from "./automation/scriptRuntime.js";
import type Device from "./device/device.js";
import DeviceEventType from "./device/deviceEventType.js";
import ServerServiceProvider from "./serviceProvider/serverServiceProvider.js";
import AutomationEventType from "./automation/automationEventType.js";
import RouteProvider from "./route/RouteProvider.js";

const APP_PORT = process.env.PORT;

const container = new Pimple();
const app = express();
const httpServer = http.createServer(app);


container
    .register(new ServerServiceProvider(httpServer))
    .register(new SettingsServiceProvider())
    .register(new DeviceServiceProvider())
    .register(new ControllerServiceProvider())
    .register(new SocketServiceProvider())
    .register(new RepositoryServiceProvider())
    .register(new SerializationServiceProvider())
    .register(new AutomationServiceProvider())
    .register(new FactoryServiceProvider())
;

const io = container.get('server.websocket') as Server;
const deviceManager = container.get('device.manager') as DeviceManager;
const scriptRuntime = container.get('automation.scriptRuntime') as ScriptRuntime;

setInterval(() => { deviceManager.discoverSerialDevices().catch(console.log) }, 3000);

// Middlewares
app
    .use(cors())
    .use(contentTypeMiddleware)
    .use(express.json())
    .use(express.text())
;

// Routes
RouteProvider.register(app, container);

// Whenever someone connects this gets executed
io.on('connection', socket => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });

    const deviceUpdateHandler = container.get('socket.deviceUpdateHandler') as DeviceUpdateHandler;

    socket.on(DeviceEventType.deviceUpdateReceived, (data) => deviceUpdateHandler.handle(data as DeviceUpdateData));
});

const serializer = container.get('serializer.classToPlain') as ClassToPlainSerializer;

deviceManager.on(DeviceEventType.deviceConnected, (device: Device) => {
    io.emit(DeviceEventType.deviceConnected, serializer.transform(device, ObjectTypeOptions.device));
    scriptRuntime.runForEvent(DeviceEventType.deviceConnected, device);
});

deviceManager.on(DeviceEventType.deviceDisconnected, (device: Device) => {
    io.emit(DeviceEventType.deviceDisconnected, serializer.transform(device, ObjectTypeOptions.device));
    scriptRuntime.runForEvent(DeviceEventType.deviceDisconnected, device);
});

deviceManager.on(DeviceEventType.deviceRefreshed, (device: Device) => {
    io.emit(DeviceEventType.deviceRefreshed, serializer.transform(device, ObjectTypeOptions.device));
    scriptRuntime.runForEvent(DeviceEventType.deviceRefreshed, device);
});

// Automation events
scriptRuntime.on(AutomationEventType.consoleLog, (data: string) => io.emit(AutomationEventType.consoleLog, data));

httpServer.listen(APP_PORT, () =>
    console.log(`SlvCtrl+ server listening on port ${APP_PORT}!`),
);

process.on('uncaughtException', (err: Error) => {
    console.error('Asynchronous error caught.', err);
});
