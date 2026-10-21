import {expect,it} from 'vitest';
import {parseStl,validateUpload,applyAppearanceTransform,defaultTransform} from '../src/appearance-upload';
import {Group,Vector3} from 'three';
it('reads ASCII and binary STL in native coordinates',()=>{
 const ascii='solid shell\nfacet normal 0 0 1\nouter loop\nvertex 10 0 0\nvertex 11 0 0\nvertex 10 1 0\nendloop\nendfacet\nendsolid shell';
 expect(parseStl(new TextEncoder().encode(ascii).buffer).positions[0]).toBe(10);
 const b=new ArrayBuffer(134),d=new DataView(b);d.setUint32(80,1,true);[10,0,0,11,0,0,10,1,0].forEach((v,i)=>d.setFloat32(96+i*4,v,true));expect(parseStl(b).positions.length).toBe(9);
});
it('rejects unsupported, empty and oversized files and invalid geometry',()=>{
 expect(()=>validateUpload('shell.obj',20)).toThrow();expect(()=>validateUpload('shell.STEP',0)).toThrow();expect(()=>validateUpload('shell.stl',60*1024*1024)).toThrow();expect(validateUpload('shell.STP',100)).toBe('step');expect(()=>parseStl(new TextEncoder().encode('solid empty\nendsolid').buffer)).toThrow();
});
it('applies scale, rotation and translation around native file origin',()=>{
 const group=new Group();applyAppearanceTransform(group,{...defaultTransform(),x:100,rz:90,scale:2});group.updateMatrix();const p=new Vector3(10,0,0).applyMatrix4(group.matrix);expect(p.x).toBeCloseTo(100);expect(p.y).toBeCloseTo(20);
 expect(()=>applyAppearanceTransform(group,{...defaultTransform(),scale:0})).toThrow();expect(()=>applyAppearanceTransform(group,{...defaultTransform(),x:NaN})).toThrow();
});
