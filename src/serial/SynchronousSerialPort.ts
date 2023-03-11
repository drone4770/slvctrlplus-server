import {Readable, Writable} from "stream";
import {cancellationTokenReasons, SequentialTaskQueue, TaskOptions} from "sequential-task-queue";

export default class SynchronousSerialPort {
    private reader: Readable;

    private writer: Writable;

    private pending = false;

    private lastSend: Date|null = null;

    private lastReceive: Date|null = null;

    private readonly queue: SequentialTaskQueue;

    public constructor(reader: Readable, writer: Writable) {
        this.reader = reader;
        this.writer = writer;
        this.queue = new SequentialTaskQueue();
        this.queue.on('error', (error: unknown) => {
            console.log('Error in queued task:');
            console.log(error);
        });
    }

    public async writeAndExpect(data: string, timeoutMs = 1000): Promise<string> {
        let removeListeners: () => void = () => { /* noop */ };

        const promise = new Promise<string>((resolve, reject) => {

            this.pending = true;

            const errorHandler = (err: Error) => {
                removeListeners();
                reject(err);
            };

            const dataHandler = (receivedData: string): void => {
                this.lastReceive = new Date();

                removeListeners();
                resolve(receivedData);
            };

            removeListeners = (): void => {
                this.reader.removeListener('data', dataHandler);
                this.reader.removeListener('error', errorHandler);
                this.pending = false;
            }

            this.reader.on('data', dataHandler);
            this.reader.on('error', errorHandler);

            this.lastSend = new Date();
            this.writer.write(data, (err: Error|null|undefined) => {
                if (err) {
                    removeListeners();
                    reject(err);
                }
            });
        });

        const options = {} as TaskOptions;

        if (timeoutMs > 0) {
            options.timeout = timeoutMs;
        }

        try {
            return await this.queue.push(() => promise, options) as unknown as Promise<string>;
        } catch (e) {
            let reason = `task cancelled for unknown reason`;

            if (e === cancellationTokenReasons.timeout) {
                reason = `task timed out (>${timeoutMs}ms)`;
            } else if (e === cancellationTokenReasons.cancel) {
                reason = 'task deliberately cancelled';
            }

            if (null !== removeListeners) {
                removeListeners();
            }

            throw new Error(reason);
        }
    }

    public writeLineAndExpect(data: string, timeoutMs = 1000): Promise<string> {
        return this.writeAndExpect(data + '\n', timeoutMs)
    }
}
