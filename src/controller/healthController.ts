import { Request, Response } from 'express';
import ControllerInterface from "./controllerInterface.js";
import process from 'process';
import osu from "node-os-utils";

export default class HealthController implements ControllerInterface
{
    public async execute(req: Request, res: Response): Promise<void>
    {
        const healthInfo: {[key: string]: any} = {
            process: {
                memoryUsage: process.memoryUsage(),
            },
            system: {
                cpu: {
                    usage: await osu.cpu.usage(100),
                    average: osu.cpu.average(),
                    cores: osu.cpu.count(),
                    model: osu.cpu.model(),
                },
                memory: await osu.mem.info(),
                os: {
                    // eslint-disable-next-line @typescript-eslint/await-thenable
                    name: await osu.os.oos(),
                    type: osu.os.type(),
                    arch: osu.os.arch(),
                    platform: osu.os.platform(),
                },
                network: {
                    netstat: await osu.netstat.stats()
                },
                ip: osu.os.ip(),
                hostname: osu.os.hostname(),
                uptime: osu.os.uptime(),
            }
        };

        res.json(healthInfo);
    }
}
