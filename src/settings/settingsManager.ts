import fs from "fs";
import PlainToClassSerializer from "../serialization/plainToClassSerializer.js";
import ClassToPlainSerializer from "../serialization/classToPlainSerializer.js";
import Settings from "./settings.js";
import onChange from "on-change";

export default class SettingsManager
{
    private readonly settingsFilePath: string;

    private settings: Settings|null = null;

    private readonly plainToClassSerializer: PlainToClassSerializer;

    private readonly classToPlainSerializer: ClassToPlainSerializer;

    public constructor(
        settingsFilePath: string,
        plainToClassSerializer: PlainToClassSerializer,
        classToPlainSerializer: ClassToPlainSerializer
    ) {
        this.settingsFilePath = settingsFilePath;
        this.plainToClassSerializer = plainToClassSerializer;
        this.classToPlainSerializer = classToPlainSerializer;
    }

    public load(): Settings {
        if (null !== this.settings) {
            return this.settings;
        }

        let tmpSettings: Settings;

        if (!fs.existsSync(this.settingsFilePath)) {
            tmpSettings = new Settings();
        } else {
            tmpSettings = this.plainToClassSerializer.transform(
                Settings,
                JSON.parse(fs.readFileSync(this.settingsFilePath, 'utf8'))
            );

            console.log(`Settings loaded from file: ${this.settingsFilePath}`);
        }

        this.settings = onChange(tmpSettings,  () => this.save());

        return this.settings;
    }

    private save(): void {
        if (null === this.settings) {
            return;
        }

        try {
            fs.writeFileSync(
                this.settingsFilePath,
                JSON.stringify(this.classToPlainSerializer.transform(this.settings))
            );
            console.log(`Settings saved to '${this.settingsFilePath}' due to a change`)
        } catch (err: unknown) {
            console.log(`Could not save settings file to '${this.settingsFilePath}': ${(err as Error).message}`)
        }
    }
}