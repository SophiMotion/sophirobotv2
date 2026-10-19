import {it,expect} from 'vitest';
import {Vector3} from 'three';
import {viewDirections} from '../src/view-directions';
import {appearanceDefaults,mechanismParams} from '../src/appearance';
import {limbMatrix,limbPivots,neutralLimbs} from '../src/limbs';
import {gesturePose} from '../src/gestures';
import {wavePose} from '../src/wave';
import {walkingPose} from '../src/walk';
const p=mechanismParams(appearanceDefaults('old'));
it('places Front on -Y and Rear on +Y',()=>{expect(viewDirections.Front).toEqual([0,-1,0]);expect(viewDirections.Rear).toEqual([0,1,0]);});
it('reaches and welcomes toward the confirmed front',()=>{
 for(const gesture of ['reach','welcome'] as const){const pose=gesturePose(gesture,2,neutralLimbs());for(const [limb,id] of [['arm_l',267],['arm_r',452]] as const){const q=limbPivots(limb,p),wrist=new Vector3(...q.wrist!).applyMatrix4(limbMatrix(id,p,pose));expect(wrist.y).toBeLessThan(q.shoulder![1]-(gesture==='reach'?100:20));}}
});
it('raises the waving arm through the front of the body',()=>{const pose=wavePose(.4,neutralLimbs()),q=limbPivots('arm_r',p),wrist=new Vector3(...q.wrist!).applyMatrix4(limbMatrix(452,p,pose));expect(wrist.y).toBeLessThan(q.shoulder![1]-100);});
it('swings the walking leg toward +Y and bends the lower leg toward the rear',()=>{const pose=walkingPose(.5),q=limbPivots('leg_l',p),knee=new Vector3(...q.knee!).applyMatrix4(limbMatrix(161,p,pose));expect(knee.y).toBeGreaterThan(q.hip![1]);const bent=neutralLimbs();bent.leg_l.elbow_bend=30;const foot=new Vector3(q.knee![0],q.knee![1],q.knee![2]-300).applyMatrix4(limbMatrix(164,p,bent));expect(foot.y).toBeGreaterThan(q.knee![1]);});
