// Adds our fields to the stock Window.
//
declare interface Window {
  LastResort?: any;
  __LastResortInstalledOnError?: any;
  importScripts?(...urls: string[]): void;
}

// We extend the stock PromiseConstructor to add things specific to Bluebird.
declare interface PromiseConstructor {
  version?: string;
  Promise?: PromiseConstructor;
  getNewLibraryCopy?: () => any;
}
