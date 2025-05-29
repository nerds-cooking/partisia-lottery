// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// This file is used to polyfill the global objects that are not available in the browser environment.

import { Buffer } from "buffer";
import crypto from "crypto-browserify";
import { EventEmitter } from "events";
// import process from "process";
import { Duplex, Stream, Transform } from "stream-browserify";

// process.version = process.version || "v23.11.1";
// window.process = process;

if (!window.Buffer) {
  window.Buffer = Buffer;
}
if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}
if (!globalThis.Transform) {
  globalThis.Transform = Transform;
}
if (!globalThis.Stream) {
  globalThis.Stream = Stream;
}
if (!globalThis.Duplex) {
  globalThis.Duplex = Duplex;
}
if (!globalThis.EventEmitter) {
  globalThis.EventEmitter = EventEmitter;
}
