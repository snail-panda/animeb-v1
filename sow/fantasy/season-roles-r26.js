/* S.O.W. Fantasy · R2.6 role-aware scoring experiment. No data edits or permanent scoring changes.
 * Scores the same published rankings, backups, drops and bonus rules as season-core-r25.
 * All numbers are trial values. Two bands for A and B; one for C/D. Weekly rank and
 * WRP both matter so a weak season's #10 is not rewarded like a normal 9+ WRP #10.
 */
(function(global){'use strict';
 const ROLE_FACTORS=Object.freeze({
  A_elite:[1.20,1.11,0.94,0.75,0.53],
  A_next:[1.27,1.16,1.02,0.88,0.70],
  B_reliable:[1.32,1.22,1.07,0.90,0.65],
  B_upside:[1.43,1.30,1.17,1.01,0.76],
  C:[1.49,1.36,1.24,1.12,0.91],
  D:[2.20,1.88,1.72,1.40,1.25,1.16]
 });
 function band(group,id,season){
  if(group==='A')return (season.groupBands.A.elite.includes(id)?'A_elite':'A_next');
  if(group==='B')return ((season.groupBands.B.reliable||[]).includes(id)?'B_reliable':'B_upside');
  return group;
 }
 function factor(group,id,e,season){
  const key=band(group,id,season),tier=ROLE_FACTORS[key];
  const r=e.r;
  const i=key==='D'?(r===1?0:r<=3?1:r<=5?2:r<=10?3:r<=15?4:5):(r<=3?0:r<=5?1:r<=10?2:r<=15?3:4);
  // Restrained, fixed WRP component. At WRP 7.0 a top-ten ranking gets ~9% less
  // than the bare rank-based coefficient; at 9.5 it gets ~6% more.
  const quality=r<=10?Math.min(1.06,Math.max(0.90,1+(e.wrp-8.5)*0.06)):1;
  return {band:key,value:tier[i]*quality,rankFactor:tier[i],quality};
 }
 function score(team,week,context,season){
  // The R2.5 engine remains the authoritative source for appearances,
  // substitutions, dropped grace, Captain eligibility, base points and ABC bonus.
  const original=global.SOWFantasyCoreR25.score(team,week,context);
  let sum=original.bonus;
  for(const g of 'ABCD'){
   const p=original.pieces[g];
   if(p.e){
    const f=factor(g,p.id,p.e,season);
    p.pts=p.parts.sum*f.value*p.multipliers.captain;
    p.multipliers.group=f.value;
    p.multipliers.upset=1;
    p.roleTrial=f;
   }
   sum+=p.pts;
  }
  original.total=sum;
  original.trialScoring=true;
  return original;
 }
 global.SOWFantasyRolesR26=Object.freeze({score,factor,band,ROLE_FACTORS});
})(window);
