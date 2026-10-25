# AnimeB Background Gallery / 背景ギャラリー

Put your own licensed JPG, PNG or WebP files here, then Commit and Push.

ファイルをこのフォルダ `images/backgrounds/` に追加して Commit・Push すると、
Weekly Rankingページの「◐ → Image → Saved on AnimeB」にサムネイルが自動表示されます。
**URLを手入力する必要はありません。** 初回は右上の `↻ Refresh` で更新してください。

The page uses the public GitHub API to list images. If the API is blocked or rate limited,
add filenames to `gallery.json` as a fallback:

```json
["example.webp", "other-background.jpg"]
```

This is a public GitHub Pages repository: only add images you have permission to publish.
Local photo imports are private to the current browser and are **not** uploaded to GitHub.
