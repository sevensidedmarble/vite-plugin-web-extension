var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// index.ts
__export(exports, {
  default: () => browserExtension,
  readJsonFile: () => readJsonFile
});
var import_path2 = __toModule(require("path"));
var import_vite = __toModule(require("vite"));
var import_fs = __toModule(require("fs"));

// src/build-script.ts
var import_path = __toModule(require("path"));
var Vite = __toModule(require("vite"));
async function buildScript(config, hookWaiter, log) {
  var _a, _b, _c, _d;
  log("Building in lib mode:", JSON.stringify(config, null, 2));
  const filename = import_path.default.basename(config.outputRelPath);
  const outDir = import_path.default.resolve((_b = (_a = config.vite.build) == null ? void 0 : _a.outDir) != null ? _b : process.cwd(), import_path.default.join(config.outputRelPath, ".."));
  const plugins = (_d = (_c = config.vite.plugins) == null ? void 0 : _c.filter((plugin) => plugin && (!("name" in plugin) || plugin.name !== "vite-plugin-web-extension"))) != null ? _d : [];
  plugins.push(hookWaiter.plugin());
  const buildConfig = {
    root: config.vite.root,
    clearScreen: false,
    mode: config.vite.mode,
    resolve: config.vite.resolve,
    plugins,
    define: config.vite.define,
    base: config.basePath,
    build: __spreadProps(__spreadValues({}, config.vite.build), {
      rollupOptions: {},
      emptyOutDir: false,
      outDir,
      watch: config.watch ? {
        clearScreen: false
      } : void 0,
      lib: {
        name: filename.replace(/-/g, "_").toLowerCase(),
        entry: config.inputAbsPath,
        formats: ["umd"],
        fileName: () => filename + ".js"
      }
    })
  };
  log("Final config:", JSON.stringify(buildConfig, null, 2));
  await Vite.build(buildConfig);
}

// src/resolve-browser-flags.ts
function resolveBrowserTagsInObject(browser, object) {
  if (Array.isArray(object)) {
    return object.map((item) => resolveBrowserTagsInObject(browser, item)).filter((item) => !!item);
  } else if (typeof object === "object") {
    return Object.keys(object).reduce((newObject, key) => {
      if (!key.startsWith("{{") || key.startsWith(`{{${browser}}}.`)) {
        newObject[key.replace(`{{${browser}}}.`, "")] = resolveBrowserTagsInObject(browser, object[key]);
      }
      return newObject;
    }, {});
  } else if (typeof object === "string") {
    if (!object.startsWith("{{") || object.startsWith(`{{${browser}}}.`)) {
      return object.replace(`{{${browser}}}.`, "");
    }
    return void 0;
  } else {
    return object;
  }
}

// src/validation.ts
var import_ajv = __toModule(require("ajv"));
var import_https = __toModule(require("https"));
var SCHEMA_URL = "https://json.schemastore.org/chrome-manifest";
async function validateManifest(log, manifest) {
  var _a, _b;
  const ajv = new import_ajv.default();
  ajv.addFormat("permission", /.*/);
  ajv.addFormat("content-security-policy", /.*/);
  ajv.addFormat("glob-pattern", /.*/);
  ajv.addFormat("match-pattern", /.*/);
  ajv.addFormat("mime-type", /.*/);
  if (typeof manifest !== "object")
    throw Error(`Manifest must be an object, got ${typeof manifest}`);
  const schema = await get(SCHEMA_URL);
  const data = ajv.validate(schema, manifest);
  if (!data) {
    log(JSON.stringify(manifest, null, 2));
    const errors = (_b = (_a = ajv.errors) != null ? _a : []) == null ? void 0 : _b.filter((err) => !!err.instancePath).map((err) => `- manifest${err.instancePath.replace(/\//g, ".")} ${err.message}`).join("\n");
    throw Error(`Invalid manifest:
${errors}`);
  }
}
var schemaCache = {};
function get(url) {
  if (schemaCache[url])
    return Promise.resolve(schemaCache[url]);
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  import_https.default.get(url, (response) => {
    let responseBody = "";
    response.on("data", (chunk) => {
      responseBody += chunk;
    });
    response.on("end", () => {
      resolve(JSON.parse(responseBody));
    });
  }).on("error", (err) => reject(err));
  promise.then((schema) => {
    schemaCache[url] = schema;
  });
  return promise;
}

// src/hook-waiter.ts
function newSource() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    reject,
    resolve
  };
}
var HookWaiter = class {
  constructor(hook) {
    __publicField(this, "sources", []);
    __publicField(this, "hook", "name");
    this.hook = hook;
  }
  plugin() {
    const index = this.sources.push(newSource()) - 1;
    return new Proxy({
      name: "vite-web-extension-hook-waiter",
      watchChange: () => {
        this.sources[index] = newSource();
      }
    }, {
      get: (target, field) => {
        if (typeof field === "symbol")
          return;
        if (target[field] != null)
          return target[field];
        if (field == this.hook) {
          this.sources[index].resolve();
        }
        return void 0;
      }
    });
  }
  waitForAll() {
    return Promise.all(this.sources.map(({ promise }) => promise));
  }
};

// index.ts
var import_md5 = __toModule(require("md5"));
var webExt = require("web-ext");
function browserExtension(options) {
  var _a, _b;
  function log(...args) {
    process.stdout.write("[0m[2m");
    if (options == null ? void 0 : options.verbose)
      console.log("[vite-plugin-web-extension]", ...args);
    process.stdout.write("[0m");
  }
  function info(...args) {
    console.log("[0m[1m[32m[vite-plugin-web-extension][0m", ...args);
  }
  function warn(message) {
    console.log(`[0m[1m[33m[vite-plugin-web-extension][0m [33m${message}[0m`);
  }
  if (options.serviceWorkerType) {
    warn("serviceWorkerType has been removed, service workers are always built in lib mode now. Remove this option");
  }
  async function getManifest() {
    return typeof options.manifest === "function" ? options.manifest() : readJsonFile(options.manifest);
  }
  function transformManifestInputs(manifestWithTs) {
    var _a2, _b2, _c, _d, _e;
    const inputIncludedMap = {};
    const generatedInputs = {};
    const generatedScriptInputs = [];
    const transformedManifest = JSON.parse(JSON.stringify(manifestWithTs));
    const styleAssets = new Set();
    const filenameToInput = (filename) => filename.substring(0, filename.lastIndexOf("."));
    const filenameToPath = (filename) => import_path2.default.resolve(moduleRoot, filename);
    const filenameToCompiledFilename = (filename) => filename.replace(/.(ts)$/, ".js").replace(/.(scss)$/, ".css");
    const transformHtml = (...manifestPath) => {
      const filename = manifestPath.reduce((parent, path3) => parent == null ? void 0 : parent[path3], transformedManifest);
      if (filename == null)
        return;
      generatedInputs[filenameToInput(filename)] = filenameToPath(filename);
    };
    const transformSandboxedHtml = (filename) => {
      const base = "sandbox";
      generatedScriptInputs.push({
        inputAbsPath: filenameToPath(filename),
        outputRelPath: import_path2.default.join(base, filename.substring(filename.lastIndexOf("/") + 1, filename.lastIndexOf("."))),
        basePath: `/${base}/`
      });
    };
    const transformScripts = (object, key) => {
      const value = object == null ? void 0 : object[key];
      if (value == null)
        return;
      const isSingleString = typeof value === "string";
      const scripts = isSingleString ? [value] : value;
      const compiledScripts = [];
      scripts.forEach((script) => {
        if (!inputIncludedMap[script]) {
          generatedScriptInputs.push({
            inputAbsPath: filenameToPath(script),
            outputRelPath: filenameToInput(script)
          });
        }
        compiledScripts.push(filenameToCompiledFilename(script));
        inputIncludedMap[script] = true;
      });
      if (isSingleString)
        object[key] = compiledScripts[0];
      else
        object[key] = compiledScripts;
    };
    const transformStylesheets = (object, key) => {
      const value = object == null ? void 0 : object[key];
      if (value == null)
        return;
      const styles = typeof value === "string" ? [value] : value;
      const onManifest = [];
      styles.forEach((style) => {
        if (style.startsWith("generated:")) {
          log("Skip generated asset:", style);
          onManifest.push(filenameToCompiledFilename(style).replace("generated:", ""));
        } else {
          styleAssets.add(style);
          onManifest.push(filenameToCompiledFilename(style));
        }
      });
      object[key] = onManifest;
    };
    const htmlExtensions = [".html"];
    const scriptExtensions = [".ts", ".js"];
    const additionalInputTypes = (_a2 = options.additionalInputs) == null ? void 0 : _a2.reduce((mapping, input) => {
      if (htmlExtensions.find((ext) => input.endsWith(ext))) {
        mapping.html.push(input);
      } else if (scriptExtensions.find((ext) => input.endsWith(ext))) {
        mapping.scripts.push(input);
      } else {
        mapping.assets.push(input);
      }
      return mapping;
    }, {
      html: [],
      scripts: [],
      assets: []
    });
    transformHtml("browser_action", "default_popup");
    transformHtml("page_action", "default_popup");
    transformHtml("action", "default_popup");
    transformHtml("options_page");
    transformHtml("options_ui", "page");
    transformHtml("background", "page");
    transformHtml("sidebar_action", "default_panel");
    additionalInputTypes == null ? void 0 : additionalInputTypes.html.forEach((filename) => {
      generatedInputs[filenameToInput(filename)] = filenameToPath(filename);
    });
    (_c = (_b2 = transformedManifest.sandbox) == null ? void 0 : _b2.pages) == null ? void 0 : _c.forEach(transformSandboxedHtml);
    transformScripts(transformedManifest.background, "scripts");
    transformScripts(transformedManifest.background, "service_worker");
    (_d = transformedManifest.content_scripts) == null ? void 0 : _d.forEach((contentScript) => {
      transformScripts(contentScript, "js");
    });
    transformScripts(transformedManifest.user_scripts, "api_script");
    transformScripts(additionalInputTypes, "scripts");
    (_e = transformedManifest.content_scripts) == null ? void 0 : _e.forEach((contentScript) => {
      transformStylesheets(contentScript, "css");
    });
    transformStylesheets(additionalInputTypes, "assets");
    if (isDevServer) {
      transformedManifest.permissions.push("http://localhost/*");
      const CSP = "script-src 'self' http://localhost:3000; object-src 'self'";
      if (transformedManifest.content_security_policy != null) {
        warn("Could not automatically add CSP to manifest to allow extension to run against dev server. Update the CSP yourself in dev mode following this guide: TODO link");
      } else if (transformedManifest.manifest_version === 2) {
        transformedManifest.content_security_policy = CSP;
      } else if (transformedManifest.manifest_version === 3) {
        throw Error("Dev server does not work for Manifest V3 because of a Chrome Bug: https://bugs.chromium.org/p/chromium/issues/detail?id=1290188");
      }
    }
    return {
      generatedInputs,
      transformedManifest,
      generatedScriptInputs,
      styleAssets: Array.from(styleAssets.values())
    };
  }
  function getAllAssets() {
    const queue = [options.assets];
    log("Searching for assets in:", options.assets);
    const assets = [];
    while (queue.length > 0) {
      const folderName = queue.shift();
      const folderPath = import_path2.default.resolve(moduleRoot, folderName);
      const children = (0, import_fs.readdirSync)(folderPath).map((filename) => import_path2.default.join(folderName, filename));
      for (const childName of children) {
        const childPath = import_path2.default.resolve(moduleRoot, childName);
        if ((0, import_fs.lstatSync)(childPath).isFile()) {
          log(`  > ${childName}`);
          assets.push(childName);
        } else {
          queue.push(childName);
        }
      }
    }
    return assets;
  }
  async function viteBuildScripts() {
    if (!hasBuiltOnce) {
      for (const input of scriptInputs != null ? scriptInputs : []) {
        process.stdout.write("\n");
        info(`Building [96m${import_path2.default.relative(process.cwd(), input.inputAbsPath)}[0m in Lib Mode`);
        await buildScript(__spreadProps(__spreadValues({}, input), {
          vite: finalConfig,
          watch: isWatching || isDevServer
        }), hookWaiter, log);
      }
      process.stdout.write("\n");
    }
    await hookWaiter.waitForAll();
  }
  async function launchBrowserAndInstall() {
    if (!isWatching && !isDevServer)
      return;
    if (disableAutoLaunch)
      return;
    if (webExtRunner == null) {
      const config = __spreadProps(__spreadValues({
        target: options.browser === null || options.browser === "firefox" ? null : "chromium"
      }, options.webExtConfig), {
        sourceDir: outDir,
        noReload: false,
        noInput: true
      });
      log("Passed web-ext run config:", JSON.stringify(options.webExtConfig));
      log("Final web-ext run config:", JSON.stringify(config));
      webExtRunner = await webExt.cmd.run(config, {
        shouldExitProgram: true
      });
    } else {
      webExtRunner.reloadAllExtensions();
      process.stdout.write("\n\n");
    }
  }
  async function onBuildEnd() {
    await viteBuildScripts();
    await launchBrowserAndInstall();
    hasBuiltOnce = true;
  }
  function pointScriptsToDevServer(htmlPath, htmlContent) {
    var _a2, _b2, _c, _d, _e;
    let newHtmlContent = htmlContent;
    const htmlFolder = import_path2.default.dirname(htmlPath);
    console.log("replacing", htmlContent);
    const scriptSrcRegex = /(<script\s+?type="module"\s+?src="(.*?)".*?>|<script\s+?src="(.*?)"\s+?type="module".*?>)/g;
    let match;
    while ((match = scriptSrcRegex.exec(htmlContent)) !== null) {
      if (match.index === scriptSrcRegex.lastIndex) {
        scriptSrcRegex.lastIndex++;
      }
      const [existingScriptTag, _, src1, src2] = match;
      const src = src1 || src2;
      console.log({ existingScriptTag, src });
      let newSrc;
      if (src.startsWith("/")) {
        newSrc = `http://localhost:3000${src}`;
      } else if (src.startsWith("./")) {
        newSrc = `http://localhost:3000/${(0, import_vite.normalizePath)(import_path2.default.join(htmlFolder, src.replace("./", "")))}`;
      } else {
        const aliases = (_c = (_b2 = finalConfig.alias) != null ? _b2 : (_a2 = finalConfig.resolve) == null ? void 0 : _a2.alias) != null ? _c : {};
        log("Aliases:", aliases);
        const alias = src.substring(0, src.includes("/") ? src.indexOf("/") : src.length);
        const matchedPath = (_d = aliases == null ? void 0 : aliases[alias]) != null ? _d : aliases == null ? void 0 : aliases[alias + "/"];
        if (!matchedPath) {
          warn(`Failed to resolve script src alias: ${existingScriptTag}, ${src}`);
          newSrc = src;
        } else {
          const filePath = src.replace(alias, matchedPath);
          const relativePath = import_path2.default.relative((_e = finalConfig.root) != null ? _e : process.cwd(), filePath);
          newSrc = `http://localhost:3000/${(0, import_vite.normalizePath)(relativePath)}`;
        }
      }
      const newScriptTag = existingScriptTag.replace(src, newSrc);
      log("Old script: " + existingScriptTag);
      log("Dev server script: " + newScriptTag);
      newHtmlContent = newHtmlContent.replace(existingScriptTag, newScriptTag);
    }
    return newHtmlContent;
  }
  let customEmitFileUnbound = function(file) {
    if (!isDevServer) {
      return this.emitFile(file);
    }
    if (file.type !== "asset") {
      throw Error("File type not supported in dev mode " + JSON.stringify(file, null, 2));
    }
    if (file.fileName == null)
      throw Error("Asset filename was missing. This is an internal error, please open an issue on GitHub");
    if (file.source == null)
      throw Error("Asset source was missing. This is an internal error, please open an issue on GitHub");
    const outFile = import_path2.default.resolve(outDir, file.fileName);
    (0, import_fs.mkdirSync)(import_path2.default.dirname(outFile), { recursive: true });
    let content;
    if (file.fileName.endsWith(".html")) {
      if (typeof file.source !== "string")
        throw Error("HTML not passed as string. This is an internal error, please open an issue on GitHub");
      content = pointScriptsToDevServer(file.fileName, file.source);
    } else {
      content = file.source;
    }
    (0, import_fs.writeFileSync)(outFile, content);
    return (0, import_md5.default)(content);
  };
  let customEmitFile;
  const browser = (_a = options.browser) != null ? _a : "chrome";
  const disableAutoLaunch = (_b = options.disableAutoLaunch) != null ? _b : false;
  let outDir;
  let moduleRoot;
  let webExtRunner;
  let isWatching;
  let finalConfig;
  let scriptInputs;
  let hasBuiltOnce = false;
  const hookWaiter = new HookWaiter("closeBundle");
  let isError = false;
  let shouldEmptyOutDir = false;
  let isDevServer = false;
  return {
    name: "vite-plugin-web-extension",
    config(viteConfig, { command }) {
      var _a2, _b2, _c;
      shouldEmptyOutDir = !!((_a2 = viteConfig.build) == null ? void 0 : _a2.emptyOutDir);
      const port = (_c = (_b2 = viteConfig.server) == null ? void 0 : _b2.port) != null ? _c : 3e3;
      isDevServer = command === "serve";
      const extensionConfig = (0, import_vite.defineConfig)({
        base: isDevServer ? `http://localhost:${port}/` : void 0,
        server: {
          port,
          hmr: {
            host: "localhost"
          }
        },
        clearScreen: false,
        build: {
          emptyOutDir: false,
          terserOptions: {
            mangle: false
          },
          rollupOptions: {
            output: {
              entryFileNames: "[name].js",
              chunkFileNames: "[name].js",
              assetFileNames: "[name].[ext]"
            }
          }
        },
        plugins: isDevServer ? [] : []
      });
      finalConfig = (0, import_vite.mergeConfig)(viteConfig, extensionConfig, true);
      return finalConfig;
    },
    configResolved(viteConfig) {
      var _a2;
      moduleRoot = viteConfig.root;
      outDir = viteConfig.build.outDir;
      isWatching = ((_a2 = viteConfig.inlineConfig.build) == null ? void 0 : _a2.watch) === true;
    },
    async buildStart(rollupOptions) {
      var _a2, _b2;
      log("Building for browser:", browser);
      log("Building with vite config:", JSON.stringify(finalConfig, null, 2));
      isError = false;
      try {
        if (!hasBuiltOnce && shouldEmptyOutDir) {
          (0, import_fs.rmSync)(outDir, { recursive: true, force: true });
        }
        const manifestWithBrowserTags = await getManifest();
        log("Manifest before browser transform:", JSON.stringify(manifestWithBrowserTags, null, 2));
        const manifestWithTs = resolveBrowserTagsInObject(browser, manifestWithBrowserTags);
        log("Manifest after browser transform:", JSON.stringify(manifestWithTs, null, 2));
        if (!options.skipManifestValidation)
          await validateManifest(log, manifestWithTs);
        const {
          transformedManifest,
          generatedInputs,
          generatedScriptInputs,
          styleAssets
        } = transformManifestInputs(manifestWithTs);
        rollupOptions.input = generatedInputs;
        scriptInputs = generatedScriptInputs;
        customEmitFile = customEmitFileUnbound.bind(this);
        if (isDevServer) {
          Object.entries(rollupOptions.input).forEach(([name, inputPath]) => {
            customEmitFile({
              type: "asset",
              fileName: `${name}.html`,
              source: (0, import_fs.readFileSync)(inputPath, "utf-8")
            });
          });
        }
        const assets = [...styleAssets, ...getAllAssets()];
        assets.forEach((asset) => {
          customEmitFile({
            type: "asset",
            fileName: asset,
            source: (0, import_fs.readFileSync)(import_path2.default.resolve(moduleRoot, asset))
          });
        });
        const manifestContent = JSON.stringify(transformedManifest, null, 2);
        customEmitFile({
          type: "asset",
          fileName: (_a2 = options == null ? void 0 : options.writeManifestTo) != null ? _a2 : "manifest.json",
          name: "manifest.json",
          source: manifestContent
        });
        log("Final manifest:", manifestContent);
        log("Final rollup inputs:", rollupOptions.input);
        if (options.printSummary !== false && !hasBuiltOnce) {
          const noneDisplay = "[0m[2m    \u2022 (none)[0m";
          process.stdout.write("\n");
          const summary = [""];
          summary.push("  Building HTML Pages in Multi-Page Mode:");
          summary.push(Object.values(rollupOptions.input).map((input) => {
            const listItem = import_path2.default.relative(process.cwd(), input);
            return `[0m[2m    \u2022 ${listItem}[0m`;
          }).join("\n") || noneDisplay);
          summary.push("  Building in Lib Mode:");
          summary.push(scriptInputs.map(({ inputAbsPath }) => {
            const listItem = import_path2.default.relative(process.cwd(), inputAbsPath);
            return `[0m[2m    \u2022 ${listItem}[0m`;
          }).join("\n") || noneDisplay);
          info(summary.join("\n"));
        }
        process.stdout.write("\n");
        info("Building HTML Pages in Multi-Page Mode");
        if (isWatching || isDevServer) {
          (_b2 = options.watchFilePaths) == null ? void 0 : _b2.forEach((file) => this.addWatchFile(file));
          assets.forEach((asset) => this.addWatchFile(import_path2.default.resolve(moduleRoot, asset)));
        }
        if (isDevServer) {
          await new Promise((res) => setTimeout(res, 1e3));
          await onBuildEnd();
        }
      } catch (err) {
        isError = true;
        throw err;
      }
    },
    async buildEnd(err) {
      if (err != null) {
        log("Skipping script builds because of error", err);
        isError = true;
        return;
      }
    },
    async closeBundle() {
      if (isError)
        return;
      await onBuildEnd();
    }
  };
}
function readJsonFile(absolutePath) {
  return JSON.parse((0, import_fs.readFileSync)(absolutePath, { encoding: "utf-8" }));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  readJsonFile
});
