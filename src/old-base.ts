import type {SourceMesh,Role} from './geometry';
import type {Params} from './parameters';
export function oldBaseRole(id:number):Role|undefined{
 if(id<1486||id>1523)return undefined;
 if(id===1488)return 'cover';
 if(id<=1489)return 'tray';
 if(id<=1497)return 'frame';
 if([1502,1507,1511,1519].includes(id))return 'tire';
 if([1500,1505,1509,1517].includes(id))return 'rim';
 return 'motor';
}
function map(v:number,a:number[],b:number[]){let i=0;while(i<a.length-2&&v>a[i+1])i++;return b[i]+(v-a[i])/(a[i+1]-a[i])*(b[i+1]-b[i]);}
export function deformOldBase(m:SourceMesh,p:Params):Float64Array{
 const a=Float64Array.from(m.positions),role=oldBaseRole(m.id),side=Math.sign(m.bounds.center[0]);
 for(let i=0;i<a.length;i+=3){let x=a[i],y=a[i+1],z=a[i+2];
  if(m.id>=1498){
   const cy=Math.sign(m.bounds.center[1])*300,dy=Math.sign(cy)*(p.wheel_base-600)/2,dx=side*(p.wheel_track-606)/2,dz=(p.od_tire-190)/2;
   if(role==='tire'||role==='rim'){
    const ry=y-cy,rz=z-99,r=Math.hypot(ry,rz),inner=(p.od_tire-p.tire_thickness)/2;
    const nr=role==='tire'?map(r,[70,95],[inner,p.od_tire/2]):r>25?map(r,[25,70],[25,inner]):r;
    y=cy+(r?ry*nr/r:0);z=99+(r?rz*nr/r:0);
   }
   x+=dx;y+=dy;z+=dz;
  }else if(role==='frame'){
   if(m.id===1490||m.id===1491){x*=((p.base_width/2-85-p.thin_sheet)/262);z+=p.base_height-200;}
   else{x+=side*(p.base_width-700)/2;z=m.id>=1496?z+p.thin_sheet-3:map(z,[92,209],[49+p.thin_sheet+40,49+p.base_height-40]);}
  }else{
   const sx=Math.sign(x),sy=Math.sign(y),inner=p.base_width/2-85;
   x=sx*map(Math.abs(x),[0,262,265,350],[0,inner-p.thin_sheet,inner,p.base_width/2]);
   // Piecewise folded-sheet preview: preserve the center and move the end folds.
   const foldWeight=Math.max(0,Math.min(1,(Math.abs(y)-350)/150));
   const angleShift=(1/Math.tan(p.base_angle*Math.PI/180)-1/Math.tan(Math.PI/6))*(z-149)*foldWeight;
   y=sy*(Math.abs(y)*p.base_length/1000+angleShift);
   z=map(z,[49,52,99,199,249,252],[49,49+p.thin_sheet,49+(p.base_height-p.base_middle_length)/2,49+(p.base_height+p.base_middle_length)/2,49+p.base_height,49+p.base_height+p.thin_sheet]);
  }
  a[i]=x;a[i+1]=y;a[i+2]=z;
 }
 return a;
}
