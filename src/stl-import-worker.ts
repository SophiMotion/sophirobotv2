import {parseStl} from './appearance-upload';
self.onmessage=(event:MessageEvent<ArrayBuffer>)=>{try{const mesh=parseStl(event.data);self.postMessage({meshes:[mesh]}, {transfer:[mesh.positions.buffer]});}catch(e){self.postMessage({error:e instanceof Error?e.message:'Unable to read STL.'});}};
