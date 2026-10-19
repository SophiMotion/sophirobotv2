import {describe,it,expect} from 'vitest';
import quotation from '../src/quotation.json';
describe('approved whole robot quotation',()=>{
 it('uses the source section totals and approved limb counts',()=>{
  expect(quotation.sections.map(s=>s.totalFen)).toEqual([260993,148432,2*(337850+63298),2*159810,121652,383200]);
  expect(quotation.sections.reduce((sum,s)=>sum+s.totalFen,0)).toBe(2036193);
 });
 it('includes every source item once and doubles arms, hands and legs',()=>{
  const items=quotation.sections.flatMap(s=>s.items);
  expect(items).toHaveLength(75);expect(new Set(items.map(i=>i.sourceRow)).size).toBe(75);
  expect(quotation.sections[2].items.find(i=>i.sourceRow===47)?.quantity).toBe(4);
  expect(quotation.sections[3].items.find(i=>i.sourceRow===70)?.quantity).toBe(4);
  expect(items.every(i=>i.quantity>0&&!('unitPrice' in i)&&!('price' in i))).toBe(true);
 });
});
