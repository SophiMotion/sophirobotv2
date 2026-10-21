import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
it('loads the shipped STEP runtime at the deployed subpath and converts a STEP body',async()=>{
 let result:any;
 const scope:any={URL,console,WebAssembly,TextDecoder,TextEncoder,setTimeout,clearTimeout,performance,location:{href:'https://example.test/sophirobotv2/appearance-step-worker.js'},postMessage:(r:any)=>result=r};scope.self=scope;
 scope.fetch=async(url:string)=>{expect(String(url)).toBe('https://example.test/sophirobotv2/vendor/occt/occt-import-js.wasm');return new Response(readFileSync('public/vendor/occt/occt-import-js.wasm'),{headers:{'Content-Type':'application/wasm'}});};
 const context=createContext(scope);scope.importScripts=(url:string)=>{expect(url).toBe('./vendor/occt/occt-import-js.js');runInContext(readFileSync('public/vendor/occt/occt-import-js.js','utf8'),context);};
 runInContext(readFileSync('public/appearance-step-worker.js','utf8'),context);
 const data=readFileSync('tests/fixtures/appearance-cube.step');await scope.onmessage({data:new Uint8Array(data).buffer});expect(result.error).toBeUndefined();expect(result.meshes.length).toBeGreaterThan(0);expect(result.meshes[0].positions.length).toBeGreaterThan(0);
},30000);
