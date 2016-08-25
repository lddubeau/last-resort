// This is a declaration that adds fields to the stock Window so that
//
declare interface Window {
  LastResort?: any;
  onunhandledrejection?: any;
  __LastResortInstalledOnError?: any;
  importScripts?(...urls: string[]): void;
}

// We extend the stock PromiseConstructor to add things specific to Bluebird.
declare interface PromiseConstructor {
  version?: string;
  Promise?: PromiseConstructor;
  getNewLibraryCopy?: () => any;
}
