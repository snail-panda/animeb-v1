/* S.O.W. Fantasy / season-specific policy — R2.5 (test season).
 * Keep this file small. Each real season will have its own version.
 * Changes to preseason groups after lock-in must be published as a new version, not silently retroactive.
 */
window.SOWFantasySeasonR25 = Object.freeze({
  year:2026, season:'Fall', rounds:12, initialSnapshotThrough:7,
  indexUrl:'../../weekly-rankings.json',
  rankingUrl(week){const ww=String(week).padStart(2,'0');return `../../ranking/2026/fall/week${ww}/ranking-week${ww}-fall2026.json`;},
  groupBands:{
    A:{elite:['kusuriya','jouheki','seitokai'],next:['hotel','oukoku','choujou','romelia','chitose','zombie']},
    B:{reliable:['hotel','seitokai','choujou','oukoku','romelia'],all:['hotel','seitokai','choujou','oukoku','romelia','chitose','tokyo','hako','zombie','toaru','vertex','goblin','rayearth','kyouran']},
    C:{all:['mezametara','tetsuryo','fx','kanata','goblin','shinja','kikansha','revo','hitakakusu','zombie','rayearth','toaru','vertex','hako']},
    D:{all:['saikyou','max','shiotaiou','fuyoshi','hyouken','tanmoshi','kyouran','aoki','psyren','revo','kikansha']}
  },
  // R2.6 TEST ONLY: B.reliable is a preseason hypothesis, NOT a locked classification.
  // All other B candidates are the upside/uncertain band. This changes scoring in trial mode only.
  // Explicit, confirmed status only. "No ranking entry" is NOT evidence of a suspension.
  statusOverrides:{chitose:{1:'upcoming'},shinja:{1:'upcoming'},zombie:{5:'noair'},hako:{5:'noair'},goblin:{6:'noair'}},
  features:{
    normalBackups:true,
    // Reserved extension points — NOT currently active or reflected in points.
    midseasonTransfer:false,
    emergencyReplenishment:false,
    exceptionalCommissionerOverride:false
  }
});
