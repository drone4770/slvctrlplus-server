import {Application} from "express-serve-static-core";
import GetScriptsController from "../controller/automation/getScriptsController.js";
import GetScriptController from "../controller/automation/getScriptController.js";
import CreateScriptController from "../controller/automation/createScriptController.js";
import DeleteScriptController from "../controller/automation/deleteScriptController.js";
import asyncHandler from "express-async-handler";
import GetLogController from "../controller/automation/getLogController.js";
import RunScriptController from "../controller/automation/runScriptController.js";
import StopScriptController from "../controller/automation/stopScriptController.js";
import StatusScriptController from "../controller/automation/statusScriptController.js";
import {Pimple} from "@timesplinter/pimple";
import GetDevicesController from "../controller/getDevicesController.js";
import GetDeviceController from "../controller/getDeviceController.js";
import PatchDeviceDataController from "../controller/patchDeviceController.js";
import HealthController from "../controller/healthController.js";
import CreateVirtualDeviceController from "../controller/virtualDevices/createVirtualDeviceController.js";

export default class RouteProvider
{
    public static register(app: Application, container: Pimple)
    {
        this.registerDeviceRoutes(app, container);
        this.registerAutomationRoutes(app, container);
        this.registerVirtualDeviceRoutes(app, container);
        this.registerOtherRoutes(app, container);
    }

    private static registerDeviceRoutes(app: Application, container: Pimple): void
    {
        app.get('/devices', (req, res) => {
            const controller = container.get('controller.getDevices') as GetDevicesController
            return controller.execute(req, res)
        });

        app.get('/device/:deviceId', (req, res) => {
            const controller = container.get('controller.getDevice') as GetDeviceController
            return controller.execute(req, res)
        });

        app.patch('/device/:deviceId', (req, res) => {
            const controller = container.get('controller.patchDevice') as PatchDeviceDataController
            return controller.execute(req, res)
        });
    }

    private static registerAutomationRoutes(app: Application, container: Pimple): void
    {
        app.get('/automation/scripts', (req, res) => {
            const controller = container.get('controller.automation.getScripts') as GetScriptsController
            return controller.execute(req, res)
        });

        app.get('/automation/scripts/:fileName([a-z\\d._-]+.js)', (req, res) => {
            const controller = container.get('controller.automation.getScript') as GetScriptController
            return controller.execute(req, res)
        });

        app.post('/automation/scripts/:fileName([a-z\\d._-]+.js)', (req, res) => {
            const controller = container.get('controller.automation.createScript') as CreateScriptController
            return controller.execute(req, res)
        });

        app.delete('/automation/scripts/:fileName([a-z\\d._-]+.js)', (req, res) => {
            const controller = container.get('controller.automation.deleteScript') as DeleteScriptController
            return controller.execute(req, res)
        });

        app.get('/automation/log', asyncHandler((req, res) => {
            const controller = container.get('controller.automation.getLog') as GetLogController
            return controller.execute(req, res)
        }));

        app.post('/automation/run', (req, res) => {
            const controller = container.get('controller.automation.runScript') as RunScriptController
            return controller.execute(req, res)
        });

        app.get('/automation/stop', (req, res) => {
            const controller  = container.get('controller.automation.stopScript') as StopScriptController
            return controller.execute(req, res)
        });

        app.get('/automation/status', (req, res) => {
            const controller  = container.get('controller.automation.statusScript') as StatusScriptController
            return controller.execute(req, res)
        });
    }

    private static registerVirtualDeviceRoutes(app: Application, container: Pimple): void
    {
        app.post('/devices/virtual', (req, res) => {
            const controller = container.get('controller.virtualDevices.create') as CreateVirtualDeviceController
            return controller.execute(req, res)
        });
    }

    private static registerOtherRoutes(app: Application, container: Pimple): void
    {
        app.get('/health', (req, res) => {
            const controller = container.get('controller.health') as HealthController
            return controller.execute(req, res)
        });
    }
}
