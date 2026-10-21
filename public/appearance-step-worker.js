/* STEP conversion runs in a disposable worker; no uploaded file leaves the browser. */
self.onmessage=async event=>{
 try{
  importScripts('./vendor/occt/occt-import-js.js');
  const occt=await occtimportjs({locateFile:name=>new URL('./vendor/occt/'+name,self.location.href).href});
  const result=occt.ReadStepFile(new Uint8Array(event.data),{linearUnit:'millimeter',linearDeflectionType:'absolute_value',linearDeflection:.3,angularDeflection:.4});
  if(!result.success||!result.meshes.length)throw new Error('No renderable bodies found in this STEP file.');
  let triangles=0;const transfers=[];
  const meshes=result.meshes.map(m=>{
   const positions=Float32Array.from(m.attributes.position.array),indices=Uint32Array.from(m.index.array);triangles+=indices.length/3;
   if(!positions.length||positions.length%3||indices.length%3||positions.some(v=>!Number.isFinite(v))||indices.some(v=>v>=positions.length/3))throw new Error('STEP contains invalid mesh data.');
   if(triangles>2000000)throw new Error('This STEP exceeds the preview limit of 2 million triangles.');
   transfers.push(positions.buffer,indices.buffer);return {name:m.name||'STEP body',positions,indices,color:m.color};
  });
  self.postMessage({meshes},transfers);
 }catch(e){self.postMessage({error:e instanceof Error?e.message:'Unable to read STEP.'});}
};
