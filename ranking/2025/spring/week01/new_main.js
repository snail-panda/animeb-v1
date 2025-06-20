
// ================== MAIN ENTRY ==================

document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('./ranking-week01-spring2025.json');
  const data = await res.json();
  populateRanking(data);
  setupPopups();
});

// ================ POPULATE ======================

function populateRanking(data) {
  const container = document.querySelector('.ranking-container');
  container.innerHTML = '';

  data.forEach((entryData, index) => {
    const card = document.createElement('div');
    card.className = `anime-card rank-${index + 1}`;
    const titleEl = document.createElement('div');
    titleEl.className = 'anime-title';

    const rank = document.createElement('span');
    rank.className = 'rank-number';
    rank.textContent = `#${index + 1}`;

    const title = document.createElement('span');
    title.className = 'title-text';
    title.textContent = entryData.title || 'No Title';

    const reviewTag = document.createElement('span');
    reviewTag.className = 'review-tag';

    // --- Review挿入処理 (EN/JPネスト対応版) ---
    const reviewData = entryData.review;
    if (
      reviewData &&
      (reviewData.en?.trim() || reviewData.jp?.trim())
    ) {
      // デフォルトで英語レビュー表示
      reviewTag.dataset.reviewEn = reviewData.en || '';
      reviewTag.dataset.reviewJp = reviewData.jp || '';
      reviewTag.dataset.lang = 'en';
      reviewTag.textContent = 'Review';
      reviewTag.style.display = 'inline-block';
    } else {
      reviewTag.style.display = 'none';
    }

    titleEl.appendChild(rank);
    titleEl.appendChild(title);
    titleEl.appendChild(reviewTag);

    card.appendChild(titleEl);
    container.appendChild(card);
  });
}

// ================ POPUP HANDLERS ==================

function setupPopups() {
  document.querySelectorAll('.review-tag').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAll();

      const reviewEn = this.dataset.reviewEn || '';
      const reviewJp = this.dataset.reviewJp || '';
      let lang = this.dataset.lang || 'en';

      const popup = createPopup('', 'review-popup');

      const contentEl = document.createElement('div');
      contentEl.className = 'popup-review-text';
      contentEl.textContent = lang === 'jp' ? reviewJp : reviewEn;

      const switchBtn = document.createElement('button');
      switchBtn.className = 'review-switch-btn';
      switchBtn.textContent = lang === 'jp' ? 'Switch to English' : '日本語に切り替え';

      const closeBtn = document.createElement('button');
      closeBtn.className = 'popup-close-btn';
      closeBtn.textContent = 'Close';

      switchBtn.addEventListener('click', () => {
        lang = lang === 'jp' ? 'en' : 'jp';
        contentEl.textContent = lang === 'jp' ? reviewJp : reviewEn;
        switchBtn.textContent = lang === 'jp' ? 'Switch to English' : '日本語に切り替え';
        btn.dataset.lang = lang;
      });

      closeBtn.addEventListener('click', closeAll);

      popup.appendChild(contentEl);
      if (reviewEn && reviewJp) popup.appendChild(switchBtn);
      popup.appendChild(closeBtn);
      positionPopup(this, popup);
    });
  });

  document.body.addEventListener('click', closeAll);
}

function closeAll() {
  document.querySelectorAll('.review-popup').forEach(p => p.remove());
}

function createPopup(content, className = '') {
  const popup = document.createElement('div');
  popup.className = className;
  popup.textContent = content;
  document.body.appendChild(popup);
  return popup;
}

function positionPopup(trigger, popup) {
  const rect = trigger.getBoundingClientRect();
  popup.style.position = 'absolute';
  popup.style.top = `${window.scrollY + rect.bottom + 5}px`;
  popup.style.left = `${window.scrollX + rect.left}px`;
}
