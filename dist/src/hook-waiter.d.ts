import { Plugin } from "vite";
/**
 * When watching for changes, the web-runner would start up immediately after finishing the first
 * build, but it needs to wait for all the child script builds as well. So this util helps wait for
 * those other builds before continuing in the parent build
 */
export declare class HookWaiter {
    private sources;
    private hook;
    constructor(hook: keyof Plugin);
    plugin(): Plugin;
    waitForAll(): Promise<void[]>;
}
