import {instanceToPlain, ClassTransformOptions, TypeOptions} from "class-transformer";

export default class ClassToPlainSerializer
{
    private readonly options?: ClassTransformOptions;

    public constructor(options?: ClassTransformOptions)
    {
        this.options = options;
    }

    public transform<T extends object, V>(object: T, typeOptions: TypeOptions|null = null): V
    {
        const result = instanceToPlain(object, this.options);

        if (typeOptions !== null && 'discriminator' in typeOptions && typeOptions.discriminator) {
            const discriminatorValue = typeOptions.discriminator.subTypes.find(obj => obj.value === object.constructor);

            if (undefined === discriminatorValue) {
                throw new Error("Could not find discriminator value for class of type: " + object.constructor.name);
            }

            result[typeOptions.discriminator.property] = discriminatorValue.name;
        }

        return result as V;
    }
}
