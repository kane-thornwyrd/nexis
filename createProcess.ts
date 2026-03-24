import { spawn as bSpawn } from "bun";

type State =
  | { type: "idle" }
  | { type: "running"; proc: Bun.Subprocess }
  | { type: "stopping"; proc: Bun.Subprocess };

export function createProcess(cmd: string[], opts?: Record<string, any>) {
  let state: State = { type: "idle" };

  // Permet de chaîner les opérations (évite les races)
  let current = Promise.resolve();

  const spawn = () => {
    const proc = bSpawn(cmd, {
      ...opts,
      stdout: "inherit",
      stderr: "inherit",
    });

    state = { type: "running", proc };

    return proc;
  };

  const kill = async (proc: Bun.Subprocess) => {
    state = { type: "stopping", proc };
    proc.kill();
    await proc.exited; // point clé : on attend réellement la fin
    state = { type: "idle" };
  };

  const start = () => {
    if (state.type === "idle") {
      spawn();
    }
  };

  const restart = () => {
    current = current.then(async () => {
      if (state.type === "running") {
        await kill(state.proc);
      }
      spawn();
    });

    return current;
  };

  const stop = () => {
    current = current.then(async () => {
      if (state.type === "running") {
        await kill(state.proc);
      }
    });

    return current;
  };

  return {
    start,
    stop,
    restart,
    getState: () => state,
  };
}
