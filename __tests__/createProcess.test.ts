import { expect, test } from "bun:test";

import { createProcess } from "../createProcess";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

type MockProc = {
  exited: Promise<number>;
  id: string;
  kill: () => void;
  killCalls: number;
  resolveExit: (value?: number) => void;
};

const createDeferred = <T>() => {
  let resolve: (value: T) => void = () => {};

  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });

  return {
    promise,
    resolve,
  } satisfies Deferred<T>;
};

const createMockSpawn = () => {
  const commands: string[][] = [];
  const options: Record<string, any>[] = [];
  const procs: MockProc[] = [];

  const spawn = (cmd: string[], opts: Record<string, any>) => {
    const deferred = createDeferred<number>();
    const proc: MockProc = {
      exited: deferred.promise,
      id: `proc-${procs.length + 1}`,
      kill: () => {
        proc.killCalls += 1;
      },
      killCalls: 0,
      resolveExit: (value = 0) => {
        deferred.resolve(value);
      },
    };

    commands.push(cmd);
    options.push(opts);
    procs.push(proc);

    return proc as unknown as Bun.Subprocess;
  };

  return { commands, options, procs, spawn };
};

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

test("starts only once while already running", () => {
  const mockSpawn = createMockSpawn();
  const processController = createProcess(["echo", "hello"], undefined, {
    spawn: mockSpawn.spawn,
  });

  processController.start();
  processController.start();

  expect(mockSpawn.procs).toHaveLength(1);
  expect(mockSpawn.commands).toEqual([["echo", "hello"]]);
  expect(mockSpawn.options[0]).toMatchObject({
    stderr: "inherit",
    stdout: "inherit",
  });
  expect(processController.getState()).toMatchObject({
    proc: mockSpawn.procs[0],
    type: "running",
  });
});

test("stop waits for process exit before returning to idle", async () => {
  const mockSpawn = createMockSpawn();
  const processController = createProcess(["echo", "hello"], undefined, {
    spawn: mockSpawn.spawn,
  });

  processController.start();
  const runningProc = mockSpawn.procs[0];
  const stopPromise = processController.stop();

  await flushMicrotasks();

  expect(runningProc?.killCalls).toBe(1);
  expect(processController.getState()).toMatchObject({
    proc: runningProc,
    type: "stopping",
  });

  runningProc?.resolveExit();
  await stopPromise;

  expect(processController.getState()).toEqual({ type: "idle" });
});

test("restart serializes overlapping restarts and ends on the latest process", async () => {
  const mockSpawn = createMockSpawn();
  const processController = createProcess(["echo", "hello"], undefined, {
    spawn: mockSpawn.spawn,
  });

  processController.start();
  const firstProc = mockSpawn.procs[0];

  const firstRestart = processController.restart();
  const secondRestart = processController.restart();

  await flushMicrotasks();

  expect(firstProc?.killCalls).toBe(1);
  expect(mockSpawn.procs).toHaveLength(1);
  expect(processController.getState()).toMatchObject({
    proc: firstProc,
    type: "stopping",
  });

  firstProc?.resolveExit();
  await firstRestart;
  await flushMicrotasks();

  const secondProc = mockSpawn.procs[1];
  expect(secondProc).toBeDefined();
  await flushMicrotasks();
  expect(secondProc?.killCalls).toBe(1);
  expect(processController.getState()).toMatchObject({
    proc: secondProc,
    type: "stopping",
  });

  secondProc?.resolveExit();
  await Promise.all([firstRestart, secondRestart]);

  const thirdProc = mockSpawn.procs[2];
  expect(mockSpawn.procs).toHaveLength(3);
  expect(processController.getState()).toMatchObject({
    proc: thirdProc,
    type: "running",
  });
});
