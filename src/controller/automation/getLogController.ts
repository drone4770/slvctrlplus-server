import { Request, Response } from 'express';
import ControllerInterface from "../controllerInterface.js";
import ScriptRuntime from "../../automation/scriptRuntime.js";

export default class GetLogController implements ControllerInterface
{
    private readonly scriptRuntime: ScriptRuntime;

    public constructor(scriptRuntime: ScriptRuntime)
    {
        this.scriptRuntime = scriptRuntime;
    }

    public async execute(req: Request, res: Response)
    {
        const maxLogLines = Number(req.query.limit) || 500;

        try {
            const lines = await this.scriptRuntime.getLog(maxLogLines)

            res.header('Content-Type', 'text/plain').status(200).end(lines);
        } catch (e: unknown) {
            res.header('Content-Type', 'text/plain').status(500).end((e as Error).message);
        }
    }
}
