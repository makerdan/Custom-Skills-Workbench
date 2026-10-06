import { spawnSync } from "node:child_process";
import process from "node:process";
import path from "path";
import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import type { Plugin } from "vite";

const MOCKUPS_DIR = "src/components/mockups";

export function mockupPreviewPlugin(): Plugin {
  let root = "";
  let isBuildCommand = false;
  let watcher: FSWatcher | null = null;

  function getMockupsAbsDir(): string {
    return path.join(root, MOCKUPS_DIR);
  }

  function isMockupFile(absolutePath: string): boolean {
    const rel = path.relative(getMockupsAbsDir(), absolutePath);
    return (
      !rel.startsWith("..") && !path.isAbsolute(rel) && rel.endsWith(".tsx")
    );
  }

  function isPreviewTarget(relativeToMockups: string): boolean {
    return relativeToMockups
      .split(path.sep)
      .every((segment) => !segment.startsWith("_"));
  }

  function invokeGenerator(): void {
    const command = [
      process.execPath,
      path.join(root, "generateMockupComponents.mjs"),
    ];
    const result = isBuildCommand
      ? spawnSync(command[0], command.slice(1), {
          cwd: root,
          stdio: "inherit",
        })
      : spawnSync(
          "python3",
          [
            "-B",
            path.resolve(root, "../../scripts/failure_gate/run_writer.py"),
            "--",
            ...command,
          ],
          { cwd: root, stdio: "inherit" },
        );

    if (result.error) throw result.error;
    if (result.signal) {
      throw new Error(`mockup generator stopped by ${result.signal}`);
    }
    if (result.status !== 0) {
      throw new Error(`mockup generator failed with exit ${result.status}`);
    }
  }

  function ensureMockupsDirectory(): void {
    const workspaceRoot = path.resolve(root, "../..");
    const result = spawnSync(
      "python3",
      [
        "-B",
        path.resolve(root, "../../scripts/failure_gate/run_writer.py"),
        "--mkdir",
        path.relative(workspaceRoot, getMockupsAbsDir()),
      ],
      { cwd: root, stdio: "inherit" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`mockup directory setup failed with exit ${result.status}`);
    }
  }

  function shouldAutoRescan(pathname: string): boolean {
    return (
      pathname.includes("/components/mockups/") ||
      pathname.includes("/.generated/mockup-components")
    );
  }

  let refreshInFlight = false;
  let refreshQueued = false;

  async function refresh(): Promise<boolean> {
    if (refreshInFlight) {
      refreshQueued = true;
      return false;
    }

    refreshInFlight = true;
    try {
      invokeGenerator();
    } finally {
      refreshInFlight = false;
    }

    if (refreshQueued) {
      refreshQueued = false;
      await refresh();
      return true;
    }

    return true;
  }

  async function onFileAddedOrRemoved(): Promise<void> {
    await refresh();
  }

  return {
    name: "mockup-preview",
    enforce: "pre",

    configResolved(config) {
      root = config.root;
      isBuildCommand = config.command === "build";
    },

    async buildStart() {
      await refresh();
    },

    async configureServer(viteServer) {
      await refresh();

      const mockupsAbsDir = getMockupsAbsDir();
      ensureMockupsDirectory();

      watcher = chokidar.watch(mockupsAbsDir, {
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      });

      watcher.on("add", (file) => {
        if (
          isMockupFile(file) &&
          isPreviewTarget(path.relative(mockupsAbsDir, file))
        ) {
          void onFileAddedOrRemoved();
        }
      });

      watcher.on("unlink", (file) => {
        if (isMockupFile(file)) {
          void onFileAddedOrRemoved();
        }
      });

      viteServer.middlewares.use((req, res, next) => {
        const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
        const pathname = requestUrl.pathname;
        const originalEnd = res.end.bind(res);

        res.end = ((...args: Parameters<typeof originalEnd>) => {
          if (res.statusCode === 404 && shouldAutoRescan(pathname)) {
            void refresh();
          }
          return originalEnd(...args);
        }) as typeof res.end;

        next();
      });
    },

    async closeWatcher() {
      if (watcher) {
        await watcher.close();
      }
    },
  };
}
