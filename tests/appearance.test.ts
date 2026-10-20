import {describe,it,expect} from 'vitest';
import old from '../public/model-appearance-old.json';
import newer from '../public/model-appearance-new.json';
import {appearanceDefaults,mechanismParams,appearanceKey} from '../src/appearance';
import {boundsOf,deform,type Model} from '../src/geometry';
import {validate} from '../src/parameters';
import {limbMatrix,neutralLimbs} from '../src/limbs';
import {headMatrix,neutralHead} from '../src/head';
import {exportPreviewStep} from '../src/step-export';
const model=old as unknown as Model,p=appearanceDefaults('old');
const mesh=(id:number)=>model.meshes.find(m=>m.id===id)!;
describe('appearance assembly',()=>{
 it('contains thirteen covers and valid dimensions on both bases',()=>{
  expect(model.meshes).toHaveLength(564);expect(newer.meshes).toHaveLength(547);
  for(const version of ['new','old'] as const)expect(validate(appearanceDefaults(version),version)).toEqual([]);
  expect(model.meshes.filter(m=>appearanceKey(m.id))).toHaveLength(13);
 });
 it('matches the measured source limb tube lengths and responds to edits',()=>{
  for(const [id,key,size] of [[153,'upper_arm_length',120],[158,'lower_arm_length',200],[161,'thigh_length',320],[164,'lower_leg_length',400],[437,'upper_arm_length',120],[451,'lower_arm_length',200],[496,'thigh_length',320],[505,'lower_leg_length',400]] as const){
   expect(boundsOf([id].flatMap(key=>Array.from(deform(mesh(key),p)))).size[2]).toBeCloseTo(size,1);
   expect(boundsOf([id].flatMap(part=>Array.from(deform(mesh(part),{...p,[key]:size+25})))).size[2]).toBeCloseTo(size+25,1);
  }
 });
 it('preserves cover coordinates at defaults and follows frame changes',()=>{
  for(const id of [2000,2001,2002,2003,2004])expect(Array.from(deform(mesh(id),p))).toEqual(mesh(id).positions);
  expect(boundsOf(deform(mesh(2000),{...p,total_height:1910})).max[2]).toBeCloseTo(1910);
  expect(boundsOf(deform(mesh(2004),{...p,hip_position:900})).center[2]-mesh(2004).bounds.center[2]).toBeCloseTo(20);
 });
 it('moves covers with the head and independent shoulder joint chains',()=>{
  const q=mechanismParams(p),pose=neutralLimbs();pose.arm_l.shoulder_lift=40;
  expect(limbMatrix(2002,q,pose).elements).toEqual(limbMatrix(153,q,pose).elements);
  expect(limbMatrix(2001,q,pose).elements).toEqual(limbMatrix(437,q,pose).elements);
  expect(headMatrix(2000,q,{rotation:30,tilt:15}).elements).toEqual(headMatrix(265,q,{rotation:30,tilt:15}).elements);
 });
 it('omits hidden appearance covers from STEP independently of the metal cover',()=>{
  const small={...model,meshes:[mesh(2000),mesh(2004)].map(m=>({...m,positions:m.positions.slice(0,9),indices:[0,1,2]}))};
  expect(exportPreviewStep(small,p,neutralLimbs(),false,()=>{},neutralHead(),{appearance_head:false}).bodyCount).toBe(1);
 });
 it('keeps all new shells on their owning joint chains',()=>{
  const q=mechanismParams(p),pose=neutralLimbs();for(const limb of Object.values(pose)){limb.shoulder_lift=25;limb.elbow_bend=40;limb.arm_twist=15;}
  for(const [cover,part] of [[2010,496],[2011,505],[2012,161],[2013,164],[2014,442],[2015,451],[2016,156],[2017,158]])expect(limbMatrix(cover,q,pose).elements).toEqual(limbMatrix(part,q,pose).elements);
 });
 it('resizes leg shells and lower arm shells along their tube attachments',()=>{
  for(const [id,key] of [[2010,'thigh_length'],[2012,'thigh_length'],[2011,'lower_leg_length'],[2013,'lower_leg_length'],[2015,'lower_arm_length'],[2017,'lower_arm_length']] as const){const before=boundsOf(deform(mesh(id),p)),after=boundsOf(deform(mesh(id),{...p,[key]:p[key]*1.1}));expect(after.size[2]/before.size[2]).toBeCloseTo(1.1);}
  for(const id of [2014,2016])expect(boundsOf(deform(mesh(id),{...p,upper_arm_length:145})).center[2]).toBeCloseTo(mesh(id).bounds.center[2]-25);
 });
});
