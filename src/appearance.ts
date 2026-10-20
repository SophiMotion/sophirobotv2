import {baseDefaults,type BaseVersion,type Params} from './parameters';
export const appearanceLabels:Record<string,string>={appearance_head:'Head cover',appearance_chest:'Chest cover',appearance_hip:'Hip cover',appearance_left:'Left shoulder cover',appearance_right:'Right shoulder cover'};
Object.assign(appearanceLabels,{appearance_arm_upper_l:'Left upper arm cover',appearance_arm_lower_l:'Left lower arm cover',appearance_arm_upper_r:'Right upper arm cover',appearance_arm_lower_r:'Right lower arm cover',appearance_leg_upper_l:'Left thigh cover',appearance_leg_lower_l:'Left lower leg cover',appearance_leg_upper_r:'Right thigh cover',appearance_leg_lower_r:'Right lower leg cover'});
export const appearanceKey=(id:number)=>({2000:'appearance_head',2001:'appearance_right',2002:'appearance_left',2003:'appearance_chest',2004:'appearance_hip',2010:'appearance_leg_upper_r',2011:'appearance_leg_lower_r',2012:'appearance_leg_upper_l',2013:'appearance_leg_lower_l',2014:'appearance_arm_upper_r',2015:'appearance_arm_lower_r',2016:'appearance_arm_upper_l',2017:'appearance_arm_lower_l'} as Record<number,string>)[id];
export const appearanceFinish:Record<number,{color:number;highlight:number}>={
  2000:{color:0xf2f2f2,highlight:0x919191}, // White head
  2001:{color:0x181818,highlight:0x686868}, // Black shoulders
  2002:{color:0x181818,highlight:0x686868},
  2003:{color:0xf2f2f2,highlight:0x919191}, // White chest
  2004:{color:0x181818,highlight:0x686868}, // Black hip
};
for(const id of [2010,2012,2014,2016])appearanceFinish[id]={color:0xf2f2f2,highlight:0x919191};
for(const id of [2011,2013,2015,2017])appearanceFinish[id]={color:0x181818,highlight:0x686868};
export const appearanceDefaults=(version:BaseVersion):Params=>({...baseDefaults(version),total_height:1810,shoulder_length:350,hip_length:320,hip_position:880,upper_arm_length:120,lower_arm_length:200,thigh_length:320,lower_leg_length:400});
// The appearance head extends 82.25 mm above the mechanism's reference top.
export const mechanismParams=(p:Params):Params=>({...p,total_height:p.total_height-82.25});
export function deformAppearance(id:number,positions:number[],p:Params){
 const a=Float64Array.from(positions),height=p.total_height-1810,hip=p.base_height-200+p.hip_position-880;
 for(let i=0;i<a.length;i+=3){
  if(id>=2010){
   const arm=id>=2014,side=[2012,2013,2016,2017].includes(id)?1:-1,lower=id%2===1;
   a[i]+=side*((arm?p.shoulder_length-350:p.hip_length-320)/2);
   if(arm){if(lower)a[i+2]=1236.75-(1236.75-a[i+2])*p.lower_arm_length/200;a[i+2]+=height-(p.upper_arm_length-120);}
   else {const top=lower?667.5:1048.75;a[i+2]=top-(top-a[i+2])*(lower?p.lower_leg_length/400:p.thigh_length/320)+hip-(lower?p.thigh_length-320:0);}
  }
  else if(id===2000)a[i+2]+=height;
  else if(id===2001||id===2002){a[i]+=(id===2002?1:-1)*(p.shoulder_length-350)/2;a[i+2]+=height;}
  else if(id===2004){a[i]*=p.hip_length/320;a[i+2]+=hip;}
  else {a[i]*=p.shoulder_length/350;const t=(a[i+2]-1125)/500;a[i+2]+=(1-t)*hip+t*height;}
 }
 return a;
}
