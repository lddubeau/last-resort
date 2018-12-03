/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2016 Louis-Dominique Dubeau
 */
/* global define module require Promise */
export interface Options {
  noUnhandledRejection: boolean;
  force: boolean;
}

let triggered: boolean = false;

export type Handler = (ev: any) => void;
export type Context = Window;

export class OnError {
  private _context: Context;
  private _registered?: Handler;
  // We keep these fields for diagnosis.
  // @ts-ignore
  private _triggered: boolean = false;
  // @ts-ignore
  private _triggeredUncaughtException: boolean = false;
  // @ts-ignore
  private _triggeredUnhandledException: boolean = false;
  private _onerror: any;
  private _onunhandledrejection: any = null;

  constructor(context: Context, options: Options) {
    this._context = context;
    this._onerror = this._makeErrorHandler();
    this._onunhandledrejection = null;

    context.addEventListener("error", this._onerror);

    if (options.noUnhandledRejection) {
      return;
    }

    const onunhandledrejection: Handler =
      this._onunhandledrejection = this._makeUnhandledRejectionHandler();

    //
    // It is currently impossible to use ``addEventListener`` robustly in
    // workers to listen for ``unhandledrejection``. In brief,
    // ``addEventListener`` works on Chrome, FF and Opera but fails
    // elsewhere. See this for details:
    //
    // https://github.com/petkaantonov/bluebird/pull/1213
    //
    // There could be more sophisticated ways to detect the issue and work
    // around it but I don't want to put more work into this than
    // necessary. This works. We check that we are in a worker. Bluebird has a
    // ``version`` field, a ``getNewLibraryCopy`` function and has a ``Promise``
    // reference on ``Promise``.
    //
    if (!(typeof self !== "undefined" && self.importScripts &&
          Promise.version && Promise.getNewLibraryCopy &&
          Promise.Promise === Promise)) {
      context.addEventListener("unhandledrejection", onunhandledrejection);
    }
    else {
      context.onunhandledrejection = onunhandledrejection;
    }
  }

  public uninstall(): void {
    const context: Context = this._context;

    if (this._onerror) {
      context.removeEventListener("error", this._onerror);
      this._onerror = null;
    }

    if (!this._onunhandledrejection) {
      return;
    }

    context.removeEventListener("unhandledrejection",
                                this._onunhandledrejection);

    // Undo the workaround if necessary.
    if (context.onunhandledrejection === this._onunhandledrejection) {
      context.onunhandledrejection = null;
    }

    this._onunhandledrejection = null;
    delete context.__LastResortInstalledOnError;
  }

  public register(fn: Handler): void {
    this._registered = fn;
  }

  private _handle(evContext: any, ev: any): void {
    const registered = this._registered;
    this._triggered = true;
    triggered = true;

    // Nothing to do!
    if (!registered) {
      return;
    }

    this.uninstall();
    registered.call(evContext, ev);
  }

  private _makeErrorHandler(): Handler {
    return (ev: any) => {
      this._triggeredUncaughtException = true;
      this._handle(this, ev);
    };
  }

  private _makeUnhandledRejectionHandler(): Handler {
    return (ev: any) => {
      this._triggeredUnhandledException = true;
      this._handle(this, ev);
    };
  }
}

export function install(context: Context, options?: Options): OnError {
  options = options || {
    force: false,
    noUnhandledRejection: false,
  };

  const force: boolean = options.force;

  const previous: OnError = context.__LastResortInstalledOnError;
  if (previous) {
    if (!force) {
      throw new Error(
        "trying to set onerror more than once on the same context.");
    }
    previous.uninstall();
  }

  const ret: OnError = context.__LastResortInstalledOnError =
    new OnError(context, options);
  return ret;
}

export function isInstalled(context: Context): boolean {
  return !!context.__LastResortInstalledOnError;
}

export function wasTriggered(): boolean {
  return triggered;
}

export const version: string = "1.0.1";
