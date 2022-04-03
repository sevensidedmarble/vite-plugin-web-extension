import * as Vite from "vite";
import { HookWaiter } from "./hook-waiter";
export interface BuildScriptConfig {
    inputAbsPath: string;
    outputRelPath: string;
    basePath?: string;
    vite: Vite.UserConfig;
    watch: boolean;
}
export declare function buildScript(config: BuildScriptConfig, hookWaiter: HookWaiter, log: Function): Promise<void>;
