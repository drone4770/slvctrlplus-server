import { Request, Response } from 'express';
import ControllerInterface from "../controllerInterface.js";
import AutomationScriptRepositoryInterface from "../../repository/automationScriptRepositoryInterface.js";

export default class CreateScriptController implements ControllerInterface
{
    private readonly automationScriptRepository: AutomationScriptRepositoryInterface;

    public constructor(
        automationScriptRepository: AutomationScriptRepositoryInterface
    ) {
        this.automationScriptRepository = automationScriptRepository;
    }

    public execute(req: Request, res: Response): void
    {
        if(!req.is('text/plain')) {
            res.status(406).send('Content-Type header must be text/plain');
            return;
        }

        const { fileName } = req.params;
        this.automationScriptRepository.save(fileName, req.body as string);

        res.header('Content-Type', 'text/plain').status(201).end(req.body as string);
    }
}
