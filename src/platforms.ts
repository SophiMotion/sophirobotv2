import platforms from './platforms.json';
import {baseDefaults,fields,type BaseVersion,type Params} from './parameters';
export {platforms};
export const baseKeys=fields.filter(f=>f.tab==='Base'||f.tab==='Wheels').map(f=>f.key);
export function configurationBase(value:{baseVersion?:unknown;sourceSha256?:unknown}):BaseVersion{
 const version=(Object.keys(platforms) as BaseVersion[]).find(k=>platforms[k].sha256===value.sourceSha256);
 if(!version||(value.baseVersion!==undefined&&value.baseVersion!==version))throw new Error('This configuration belongs to a different model or format.');
 return version;
}
export function withBaseParameters(shared:Params,version:BaseVersion,saved?:Params):Params{
 const next={...shared},base=saved||baseDefaults(version);for(const key of baseKeys)next[key]=base[key];return next;
}
