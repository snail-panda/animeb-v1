const STR = {
  en: {
    heading_reco: `Summer 2025 Anime: 
End-of-Season Recommendations`,
    last_updated: "Last updated: August 16, 2025",
    note_reco: `* This ranking is based purely on personal impression and taste.
The order, impressions, and comments reflect a natural, irresistible sense. Please forgive any differences in feeling with yours, and try to "believe, wait, and forgive."
Some titles not ranked may still be included as honorable mentions.`,
    top3: "🏆 top3",
    blurb_top3: "(If nothing else, at least watch these… or else)",
    top5: "🎖️ top5",
    blurb_top5: "(If you claim to like anime—or even if you don’t—you should still watch these.)",
    top8: "top8",
    blurb_top8: "(For anime fans, these should be automatic picks.)",
    top10: "top10",
    blurb_top10: "(If you can only watch 10 shows this season, start here.)",
    additional: "Additional Picks",
    blurb_extra: "(If you’ve got room—these are worth your time.)",
    heading_enj: "Enjoyment Ranking",
    caption_enj: "(Based on enjoyment, not evaluation—includes non-ranked titles.)",
    note_enj: `Note: This includes shows not eligible for ranking. It's simply a list of what I’m genuinely enjoying or looking forward to the most.`
  },
  jp: {
    heading_reco: `2025年夏アニメ
おすすめ作品（シーズン終了時点）`,
    last_updated: "最終更新日: 2025年10月4日",
    note_reco: `※このランキングは完全にピュアな主観・個人的な感覚によるものです。
順位、感想・コメント等に関しては、"自然にそう感じてしまっていて抗えないもの"なので、しょうがないと諦めてください。もし自分の感じ方と違うとしても、そこは「信じ、待ち、許す」でお願いします。
ランキングでは対象外とした作品も含まれます。`,
    top3: "🏆 ベスト3",
    blurb_top3: "（最悪これだけでも見て欲しい、、、さもなくば）",
    top5: "🎖️ ベスト5",
    blurb_top5: "（自称アニメ好きなら当然、そうでなくとも余裕があれば抑えるべき）",
    top8: "ベスト8",
    blurb_top8: "（アニメファンならこのあたりまでも当然）",
    top10: "ベスト10",
    blurb_top10: "（クール毎の視聴数を10作品に抑えたい場合）",
    additional: "追加おすすめ",
    blurb_extra: "（余力があれば是非）",
    heading_enj: "楽しんで見ている順",
    caption_enj: "（個人的満足度、純粋な\"楽しさ\"のみを基準＋対象外含む）",
    note_enj: `※以下にはランキング対象外の作品も含まれます。
評価とは別に「自分が楽しみにしている/純粋に楽しんでいる順番」です。`
  }
};


window.applyI18n = function(lang = (window.lang || 'en')) {
  const dict = STR[lang] || STR.en;  // ← ここだけ修正（window.STR を使わない）
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = (dict[key] ?? STR.en[key] ?? key);
    if ('i18nBr' in el.dataset) {
      el.innerHTML = String(val).replace(/\n/g, '<br>');
    } else {
      el.textContent = val;
    }
  });
};