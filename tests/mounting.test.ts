import {it,expect} from 'vitest';
import modelData from '../public/model-appearance-old.json';
import mounts from '../src/mounting-parts.json';
import {appearanceDefaults,mechanismParams} from '../src/appearance';
import {deform,boundsOf,type Model} from '../src/geometry';
import {neutralLimbs,limbMatrix} from '../src/limbs';
const model=modelData as unknown as Model,p=appearanceDefaults('old');
it('keeps new limb mounts rigid and on the owning joint chain',()=>{
 const poses=neutralLimbs();poses.leg_l.elbow_bend=45;poses.arm_r.elbow_bend=60;
 for(const [id,m] of Object.entries(mounts)){
  const mesh=model.meshes.find(v=>v.id===Number(id))!;
  if('referenceId' in m){expect(limbMatrix(mesh.id,mechanismParams(p),poses).elements).toEqual(limbMatrix(m.referenceId,mechanismParams(p),poses).elements);}
  if('lengthKey' in m){const key=m.lengthKey as keyof typeof p,before=boundsOf(deform(mesh,p)),after=boundsOf(deform(mesh,{...p,[key]:p[key]+40}));for(let k=0;k<3;k++)expect(after.size[k]).toBeCloseTo(before.size[k],6);expect(after.center[2]-before.center[2]).toBeCloseTo(-40*m.lengthFraction,6);}
 }
});
it('moves chest mounts with the torso without stretching the mounting hardware',()=>{
 const mesh=model.meshes.find(m=>m.id===600)!,before=boundsOf(deform(mesh,p)),after=boundsOf(deform(mesh,{...p,total_height:p.total_height+100}));
 expect(after.center[2]-before.center[2]).toBeCloseTo(100*mounts['600'].chestHeightRatio,6);
 for(let k=0;k<3;k++)expect(after.size[k]).toBeCloseTo(before.size[k],6);
});
