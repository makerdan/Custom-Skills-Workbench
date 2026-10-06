import { spawnSync } from "node:child_process";
import type { StdioOptions } from "node:child_process";
import process from "node:process";
import path from "path";
import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import type { Plugin } from "vite";

const MOCKUPS_DIR = "src/components/mockups";

export function mockupPreviewPlugin(): Plugin {
  let root = "";
  let watcher: FSWatcher | null = null;

  function inheritedLockFd(): number | null {
    const value = process.env.FAILURE_GATE_WRITER_FD;
    if (value === undefined) return null;
    const fd = Number(value);
    if (!Number.isSafeInteger(fd) || fd < 3) {
      throw new Error("invalid inherited Failure Gate writer descriptor");
    }
    return fd;
  }

  function writerStdio(fd: number | null): StdioOptions {
    return fd === null ? "inherit" : ["inherit", "inherit", "inherit", fd];
  }

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
    const fd = inheritedLockFd();
    const result = spawnSync(
      process.execPath,
      [path.join(root, "generateMockupComponents.mjs")],
      { cwd: root, stdio: writerStdio(fd) },
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
    const fd = inheritedLockFd();
    const args = [
      "-B",
      path.resolve(root, "../../scripts/failure_gate/run_writer.py"),
    ];
    if (fd !== null) args.push("--inherited-lock-fd", String(fd));
    args.push("--mkdir", path.relative(workspaceRoot, getMockupsAbsDir()));
    const result = spawnSync(
      "python3",
      args,
      { cwd: root, stdio: writerStdio(fd) },
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
