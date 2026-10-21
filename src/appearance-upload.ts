import {Object3D,MathUtils} from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
export interface UploadMesh {name:string;positions:Float32Array;indices?:Uint32Array;color?:number[]}
export interface AppearanceTransform {x:number;y:number;z:number;rx:number;ry:number;rz:number;scale:number}
export const defaultTransform=():AppearanceTransform=>({x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:1});
export function validateUpload(name:string,bytes:number):'step'|'stl'{
 if(!/\.(stl|step|stp)$/i.test(name))throw new Error('Choose an STL or STEP file.');
 if(bytes<=0)throw new Error('The file is empty.');
 if(bytes>50*1024*1024)throw new Error('Each file must be 50 MB or smaller.');
 return /\.stl$/i.test(name)?'stl':'step';
}
export function parseStl(buffer:ArrayBuffer):UploadMesh{
 const g=new STLLoader().parse(buffer);try{const attr=g.getAttribute('position');if(!attr||attr.count<3||attr.count%3!==0||attr.count>6000000)throw new Error('STL must contain 1 to 2 million triangles.');const positions=Float32Array.from(attr.array);if(positions.some(v=>!Number.isFinite(v)))throw new Error('STL contains invalid coordinates.');return {name:'STL surface',positions};}finally{g.dispose();}
}
export function applyAppearanceTransform(object:Object3D,t:AppearanceTransform){
 if(Object.values(t).some(v=>!Number.isFinite(v))||t.scale<.001||t.scale>1000||[t.x,t.y,t.z].some(v=>Math.abs(v)>10000)||[t.rx,t.ry,t.rz].some(v=>Math.abs(v)>360))throw new Error('Use valid position, rotation and scale values.');
 object.position.set(t.x,t.y,t.z);object.rotation.set(MathUtils.degToRad(t.rx),MathUtils.degToRad(t.ry),MathUtils.degToRad(t.rz),'XYZ');object.scale.setScalar(t.scale);object.updateMatrixWorld(true);
}
