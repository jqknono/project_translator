# Markdown 風格指南

Markdown 之所以令人耳目一新，很大程度上是因為它能夠以純文字撰寫，並產生出色的格式化輸出。為了讓下一位作者能有個乾淨的起點，您的 Markdown 應該盡可能地簡單，並與整個語料庫保持一致。

我們力求平衡三個目標：

1.  *原始文字可讀且可移植。*
2.  *Markdown 語料庫在時間和團隊之間是可維護的。*
3.  *語法簡單易記。*

目錄：

1.  [最低可行文件](#minimum-viable-documentation)
2.  [更好勝於最好](#better-is-better-than-best)
3.  [大寫](#capitalization)
4.  [文件佈局](#document-layout)
5.  [目錄](#table-of-contents)
6.  [字元行數限制](#character-line-limit)
7.  [尾隨空格](#trailing-whitespace)
8.  [標題](#headings)
    1.  [ATX 樣式標題](#atx-style-headings)
    1.  [為標題使用唯一、完整的名稱](#use-unique-complete-names-for-headings)
    1.  [為標題新增間距](#add-spacing-to-headings)
    1.  [使用單個 H1 標題](#use-a-single-h1-heading)
    1.  [標題和大標題的大寫](#capitalization-of-titles-and-headers)
9.  [清單](#lists)
    1.  [長清單使用惰性編號](#use-lazy-numbering-for-long-lists)
    1.  [巢狀清單間距](#nested-list-spacing)
10. [程式碼](#code)
    1.  [行內](#inline)
    1.  [使用程式碼跨度進行跳脫](#use-code-span-for-escaping)
    1.  [程式碼區塊](#codeblocks)
        1.  [宣告語言](#declare-the-language)
        1.  [跳脫換行符號](#escape-newlines)
        1.  [使用圍欄式程式碼區塊，而不是縮排程式碼區塊](#use-fenced-code-blocks-instead-of-indented-code-blocks)
        1.  [在清單中巢狀程式碼區塊](#nest-codeblocks-within-lists)
11. [連結](#links)
    1.  [在 Markdown 中，連結使用明確路徑](#use-explicit-paths-for-links-within-markdown)
    1.  [除非在同一目錄下，否則避免使用相對路徑](#avoid-relative-paths-unless-within-the-same-directory)
    1.  [使用資訊豐富的 Markdown 連結標題](#use-informative-markdown-link-titles)
    1.  [參考連結](#reference-links)
        1.  [長連結使用參考連結](#use-reference-links-for-long-links)
        1.  [使用參考連結來減少重複](#use-reference-links-to-reduce-duplication)
        1.  [在第一次使用後定義參考連結](#define-reference-links-after-their-first-use)
12. [圖片](#images)
13. [表格](#tables)
14. [強烈建議使用 Markdown 而非 HTML](#strongly-prefer-markdown-to-html)

## 最簡可行文件

一小組新鮮且準確的文件勝過一個龐大、鬆散的，處於各種失修狀態的「文件」集合。

**Markdown 的方式**鼓勵工程師對他們的文件負責，並像我們保持測試良好狀態一樣，熱衷於保持它們的更新。努力做到這一點。

*   確定你真正需要的：發布文件、API 文件、測試指南。
*   經常且小批量地刪除無用之物。

## 更好勝於最好

內部文件審閱的標準與程式碼審閱的標準不同。審閱者應該要求改進，但總體而言，作者應該始終能夠援引「更好/最好原則」。

快速迭代是你的朋友。為了獲得長期改進，**作者在進行短期改進時必須保持生產力**。為每個 CL 設定較低的標準，以便**更多這樣的 CL** 可以發生。

作為文件 CL 的審閱者：

1.  在合理的情況下，立即 LGTM（Looks Good To Me，看起來不錯）並相信評論將得到適當的修復。
2.  寧願提出替代方案，也不要留下模糊的評論。
3.  對於實質性的變更，請啟動你自己的後續 CL。尤其要避免「你應該*也*...」形式的評論。
4.  在極少數情況下，如果 CL 實際上使文件變得更糟，則阻止提交。可以要求作者還原。

作為作者：

1.  避免在瑣碎的爭論上浪費時間。儘早屈服並繼續前進。
2.  根據需要經常引用更好/最好原則。

## 大小寫

使用產品、工具和二進制文件的原始名稱，保留大小寫。例如：

```markdown
# Markdown style guide

`Markdown` is a dead-simple platform for internal engineering documentation.
```

而不是

```markdown
# markdown bad style guide example

`markdown` is a dead-simple platform for internal engineering documentation.
```

## 文件佈局

通常，文件受益於以下佈局的某種變體：

```markdown
# Document Title

Short introduction.

[TOC]

## Topic

Content.
```

## 另請參閱

* https://link-to-more-info

1.  `# 文件標題`: 第一個標題應為一級標題，理想情況下與文件名相同或幾乎相同。第一個一級標題用作頁面的 `<title>`。

1.  `author`: *可選*。如果您想聲明對文件的所有權，或者您對它感到非常自豪，請在標題下添加您自己。但是，修訂歷史通常就足夠了。

1.  `簡短介紹。` 1-3 句話提供主題的高層次概述。想像一下自己是一個完全的新手，偶然發現了您的「擴展 Foo」文檔，並且不知道您認為理所當然的最基本資訊。「什麼是 Foo？我為什麼要擴展它？」

1.  `[TOC]`: 如果您使用的託管服務支援目錄，例如 Gitiles，請將 `[TOC]` 放在簡短介紹之後。請參閱 [`[TOC]` 文件][TOC-docs]。

1.  `## 主題`: 其餘標題應從第 2 級開始。

1.  `## 另請參閱`: 將其他連結放在底部，供想要了解更多資訊或沒有找到所需內容的使用者使用。

[TOC-docs]: https://gerrit.googlesource.com/gitiles/+/HEAD/Documentation/markdown.md#Table-of-contents

## 目錄

### 使用 `[TOC]` 指令

除非您的所有內容都在筆記型電腦上的首屏[^above]之上，否則請使用 [`[TOC]` 指令][TOC-docs]。

[^above]: 如果頁面首次顯示時可見，則內容位於「首屏之上」。如果內容在使用者於電腦上向下滾動頁面或實際展開報紙等文件之前被隱藏，則內容位於「首屏之下」。

### 將 `[TOC]` 指令放在介紹之後

將 `[TOC]` 指令放在頁面的介紹之後和第一個 H2 標題之前。例如：

```markdown
# 我的頁面

這是 TOC **之前**的介紹。

[TOC]

## 我的第一個 H2
```

```markdown
# 我的頁面

[TOC]

這是 TOC **之後**的介紹，它不應該在那裡。

## 我的第一個 H2
```

對於以視覺方式閱讀您文檔的使用者來說，`[TOC]` 指令的放置位置無關緊要，因為 Markdown 始終將 TOC 顯示在頁面的頂部和右側。但是，當涉及螢幕閱讀器或鍵盤控制時，`[TOC]` 的放置位置非常重要。

這是因為 `[TOC]` 會將目錄的 HTML 插入到 DOM 中，無論您在 Markdown 檔案中包含該指令的位置。例如，如果您將指令放在檔案的最底部，螢幕閱讀器將在到達文檔末尾之前不會讀取它。

## 字元行數限制

Markdown 內容遵循 80 個字元行數限制的殘餘慣例。
為什麼？因為這是我們大多數人編寫程式碼的方式。

*   **工具整合**：我們所有的工具都是圍繞程式碼設計的，因此我們的文件格式越符合類似的規則，這些工具的效果就越好。例如，程式碼搜尋不會自動換行。

*   **品質**。工程師在建立和編輯 Markdown 內容時，越能運用他們熟練的程式碼編寫習慣，品質就越好。Markdown 利用了我們已經擁有的優秀審閱文化。

### 例外情況

80 個字元規則的例外情況包括：

*   連結
*   表格
*   標題
*   程式碼區塊

這表示包含連結的行可以超出第 80 欄，以及任何相關的標點符號：

```markdown
*   請參閱
    [foo 文件](https://gerrit.googlesource.com/gitiles/+/HEAD/Documentation/markdown.md)。
    並找到日誌檔。
```

但是，請注意連結前後的文字會被換行。

表格也可能很長。但是，有一些
[建立簡短、可讀表格的最佳實踐](#tables)。

```markdown
Foo                                                                           | Bar | Baz
----------------------------------------------------------------------------- | --- | ---
Somehow-unavoidable-long-cell-filled-with-content-that-simply-refuses-to-wrap | Foo | Bar
```

## 尾隨空白

不要使用尾隨空白。使用尾隨反斜線來斷行。

[CommonMark 規範](http://spec.commonmark.org/0.20/#hard-line-breaks)規定，行尾的兩個空格應插入一個 `<br />` 標籤。但是，許多目錄都有一個預提交檢查來檢查尾隨空白，並且許多 IDE 會以任何方式清理它。

謹慎地使用尾隨反斜線：

```markdown
由於某些原因，我只是真的很想在這裡換行，\
雖然可能沒有必要。
```

最佳實踐是完全避免需要 `<br />`。一對換行符將建立一個段落標籤；習慣它。

## 標題

### ATX 樣式的標題

```markdown
# 標題 1

## 標題 2
```

帶有 `=` 或 `-` 底線的標題可能難以維護，並且與標題語法的其餘部分不符。編輯器必須問：`---` 是指 H1 還是 H2？

```markdown
標題 - 你還記得是什麼級別嗎？不要這樣做。
---------
```

### 為標題使用唯一、完整的名稱

為每個標題使用唯一且完全描述性的名稱，即使是子章節也是如此。由於連結錨點是從標題建構的，這有助於確保自動建構的錨點連結直觀且清晰。

例如，不要使用：

```markdown
## Foo
### 摘要
### 範例
## Bar
### 摘要
### 範例
```

而是首選：

```markdown
## Foo
### Foo 摘要
### Foo 範例
## Bar
### Bar 摘要
### Bar 範例
```

### 在標題中新增間距

首選在 `#` 之後和之前和之後新增換行符：

```markdown
...之前的文字。
```
## 標題 2

文字之後...
```

缺乏間距會使原始碼更難以閱讀：

```markdown
...文字之前。

##標題 2
文字之後... 請勿這樣做。
```

### 使用單一 H1 標題

使用一個 H1 標題作為文件的標題。後續標題應為 H2 或更深層級。有關更多資訊，請參閱[文件佈局](#document-layout)。

### 標題和大標題的 capitalized

遵循
[capitalization](https://developers.google.com/style/capitalization#capitalization-in-titles-and-headings)
中的指南
[Google 開發人員文件風格指南](https://developers.google.com/style/)。

## 列表

### 對於長列表使用惰性編號

Markdown 足夠聰明，可以讓產生的 HTML 正確呈現您的編號列表。對於可能更改的較長列表，尤其是長的巢狀列表，請使用「惰性」編號：

```markdown
1.  Foo.
1.  Bar.
    1.  Foofoo.
    1.  Barbar.
1.  Baz.
```

但是，如果列表很小並且您不希望更改它，則最好使用完全編號的列表，因為它在原始碼中更容易閱讀：

```markdown
1.  Foo.
2.  Bar.
3.  Baz.
```

### 巢狀列表間距

巢狀列表時，編號列表和項目符號列表都使用 4 個空格的縮排：

```markdown
1.  在項目編號後使用 2 個空格，以便文字本身縮排 4 個空格。
    對於換行文字，使用 4 個空格的縮排。
2.  再次使用 2 個空格作為下一個項目。

*   在項目符號後使用 3 個空格，以便文字本身縮排 4 個空格。
    對於換行文字，使用 4 個空格的縮排。
    1.  與之前一樣，在編號列表中使用 2 個空格。
        巢狀列表中的換行文字需要 8 個空格的縮排。
    2.  看起來不錯，不是嗎？
*   回到項目符號列表，縮排 3 個空格。
```

以下方法有效，但非常混亂：

```markdown
* 一個空格，
對於換行文字沒有縮排。
     1. 不規則的巢狀結構... 請勿這樣做。
```

即使沒有巢狀結構，使用 4 個空格的縮排也可以使換行文字的佈局保持一致：

```markdown
*   Foo,
    使用 4 個空格的縮排換行。

1.  列表項目的兩個空格
    以及換行文字之前的 4 個空格。
2.  回到 2 個空格。
```

但是，當列表很小、沒有巢狀結構且為單行時，一種空格足以滿足兩種列表：

```markdown
* Foo
* Bar
* Baz.

1. Foo.
2. Bar.
```

## 程式碼

### 行內

&#96;反引號&#96; 指定將按字面呈現的 `行內程式碼`。將它們用於簡短的程式碼引用、欄位名稱等：

```markdown
您需要執行 `really_cool_script.sh arg`。

請注意該表格中的 `foo_bar_whammy` 欄位。
```

當以通用意義提及檔案類型時，而不是特定的現有檔案時，請使用行內程式碼：

```markdown
請務必更新您的 `README.md`！
```

### 使用程式碼範圍來跳脫

當您不希望文字被當作一般的 Markdown 處理時，例如假的路徑或範例 URL，這些會導致錯誤的自動連結，請用反引號將其包起來：

```markdown
一個 Markdown 短連結的範例會是：`Markdown/foo/Markdown/bar.md`

一個查詢的範例可能是：`https://www.google.com/search?q=$TERM`
```

### 程式碼區塊

對於長於單行的程式碼引用，請使用圍欄式程式碼區塊：

<pre>
```python
def Foo(self, bar):
  self.bar = bar
```
</pre>

#### 宣告語言

最佳實踐是明確宣告語言，這樣語法高亮器和下一個編輯器都不需要猜測。

#### 使用圍欄式程式碼區塊，而不是縮排式程式碼區塊

四個空格的縮排也會被解釋為程式碼區塊。但是，我們強烈建議所有程式碼區塊都使用圍欄式。

縮排式程式碼區塊在原始碼中看起來有時更乾淨，但它們有幾個缺點：

*   您無法指定語言。某些 Markdown 功能與語言指定符相關聯。
*   程式碼區塊的開始和結束不明確。
*   縮排式程式碼區塊在程式碼搜尋中更難搜尋。

```markdown
您需要執行：

    bazel run :thing -- --foo

然後：

    bazel run :another_thing -- --bar

再次：

    bazel run :yet_again -- --baz
```

#### 跳脫換行符號

因為大多數命令列程式碼片段都旨在直接複製並貼到終端機中，所以最佳實踐是跳脫任何換行符號。在行尾使用單個反斜線：

<pre>
```shell
$ bazel run :target -- --flag --foo=longlonglonglonglongvalue \
  --bar=anotherlonglonglonglonglonglonglonglonglonglongvalue
```
</pre>

#### 在清單中巢狀程式碼區塊

如果您需要在清單中使用程式碼區塊，請確保縮排它，以免破壞清單：

```markdown
*   項目符號。

    ```c++
    int foo;
    ```

*   下一個項目符號。
```

您也可以使用 4 個空格建立巢狀程式碼區塊。只需從清單縮排中額外縮排 4 個空格：

```markdown
*   項目符號。

        int foo;

*   下一個項目符號。
```

## 連結

長的連結會使原始 Markdown 難以閱讀，並破壞 80 個字元的換行。**盡可能縮短您的連結**。

### 對於 Markdown 內的連結，使用明確的路徑

對於 Markdown 連結，請使用明確的路徑。例如：

```markdown
[...](/path/to/other/markdown/page.md)
```

您不需要使用完整的 URL：

```markdown
[...](https://bad-full-url.example.com/path/to/other/markdown/page.md)
```

### 避免使用相對路徑，除非在同一個目錄下

相對路徑在同一個目錄下是相當安全的。例如：

```markdown
[...](other-page-in-same-dir.md)
[...](/path/to/another/dir/other-page.md)
```

如果需要使用 `../` 指定其他目錄，請避免使用相對連結：

```markdown
[...](../../bad/path/to/another/dir/other-page.md)
```

### 使用資訊豐富的 Markdown 連結標題

Markdown 連結語法允許您設定連結標題。請明智地使用它。使用者通常不會閱讀文件，而是掃描它們。

連結會吸引目光。但是，將連結標題設為「這裡」、「連結」，或僅僅複製目標 URL，對於匆忙的讀者來說，毫無意義，並且浪費空間：

```markdown
不要這樣做。

請參閱 Markdown 指南以獲取更多資訊：[link](markdown.md)，或查看樣式指南[here](style.md)。

查看一個典型的測試結果：
[https://example.com/foo/bar](https://example.com/foo/bar)。
```

相反，自然地撰寫句子，然後回頭用連結包裹最合適的短語：

```markdown
請參閱 [Markdown 指南](markdown.md) 以獲取更多資訊，或查看 [樣式指南](style.md)。

查看一個 [典型的測試結果](https://example.com/foo/bar)。
```

### 參考

對於長連結或圖片網址，您可能想要將連結的使用與連結定義分開，如下所示：

<!-- 已知錯誤：我們在此處使用零寬度不斷行空格 (U+FEFF) 以防止 -->
<!-- 參考連結在程式碼區塊中呈現。-->

```markdown
請參閱 [Markdown 樣式指南][style]，其中包含使文件更易於閱讀的建議。

[style]: http://Markdown/corp/Markdown/docs/reference/style.md
```

#### 對於長連結使用參考連結

如果連結的長度會影響周圍文字的可讀性（如果它是內嵌的），請使用參考連結。 參考連結會使在原始文字中更難看到連結的目的地，並增加額外的語法。

在此範例中，使用參考連結並不適當，因為連結不夠長，不會擾亂文字的流動：

```markdown
不要這樣做。

[樣式指南][style_guide] 說除非必要，否則不要使用參考連結。

[style_guide]: https://google.com/Markdown-style
```

直接內嵌它：

```markdown
https://google.com/Markdown-style 說除非必要，否則不要使用參考連結。
```

在此範例中，連結目的地夠長，因此使用參考連結是有意義的：

```markdown
[樣式指南] 說除非必要，否則不要使用參考連結。

[樣式指南]: https://docs.google.com/document/d/13HQBxfhCwx8lVRuN2Wf6poqvAfVeEXmFVcawP5I6B3c/edit
```

在表格中更常使用參考連結。 保持表格內容簡短尤其重要，因為 Markdown 不提供在儲存格表格中跨多行斷行的功能，並且較小的表格更易於閱讀。

例如，此表格的可讀性因內嵌連結而降低：

```markdown
不要這樣做。

網站                                                             | 描述
---------------------------------------------------------------- | -----------------------
[網站 1](http://google.com/excessively/long/path/example_site_1) | 這是範例網站 1。
[網站 2](http://google.com/excessively/long/path/example_site_2) | 這是範例網站 2。
```

相反，使用參考連結來保持行長度易於管理：

```markdown
網站     | 描述
-------- | -----------------------
[網站 1] | 這是範例網站 1。
[網站 2] | 這是範例網站 2。

[網站 1]: http://google.com/excessively/long/path/example_site_1
[網站 2]: http://google.com/excessively/long/path/example_site_2
```

#### 使用參考連結來減少重複

當在文件中多次引用相同的連結目的地時，請考慮使用參考連結以減少重複。

#### 在首次使用後定義參考連結

我們建議將參考連結定義放在下一個標題之前，即它們首次使用的章節的末尾。 如果您的編輯器對它們應該放在哪裡有自己的看法，請不要與之抗爭； 工具總是會贏。

我們將「章節」定義為兩個標題之間的所有文字。 想想參考連結

如同註腳，以及目前的章節如同目前的頁面。

這種安排方式讓在原始碼檢視中輕鬆找到連結目的地，同時保持文字流暢，避免雜亂。在具有大量參考連結的長文件中，它還可以防止檔案底部的「註腳過載」，這使得難以挑選出相關的連結目的地。

此規則有一個例外：在多個章節中使用的參考連結定義應放在文件的末尾。這可以避免在更新或移動章節時出現懸空連結。

在以下範例中，參考定義遠離其初始使用位置，這使得文件更難以閱讀：

```markdown
# 標題 FOR A BAD DOCUMENT

一些帶有 [連結][link_def] 的文字。

一些帶有相同 [連結][link_def] 的更多文字。

## 標題 2

... 大量文字 ...

## 標題 3

一些使用 [不同連結][different_link_def] 的更多文字。

[link_def]: http://reallyreallyreallylonglink.com
[different_link_def]: http://differentreallyreallylonglink.com
```

相反，將其放在首次使用後的標題之前：

```markdown
# 標題

一些帶有 [連結][link_def] 的文字。

一些帶有相同 [連結][link_def] 的更多文字。

[link_def]: http://reallyreallyreallylonglink.com

## 標題 2

... 大量文字 ...

## 標題 3

一些使用 [不同連結][different_link_def] 的更多文字。

[different_link_def]: http://differentreallyreallylonglink.com
```

## 圖片

請參閱 [圖片語法](https://gerrit.googlesource.com/gitiles/+/HEAD/Documentation/markdown.md#Images)。

謹慎使用圖片，並首選簡單的螢幕截圖。本指南的設計理念是，純文字可以讓使用者更快地進行溝通，減少讀者的分心和作者的拖延。但是，有時顯示你的意思非常有幫助。

*   當*顯示*讀者某件事比*描述*它更容易時，請使用圖片。例如，用圖片解釋如何導航 UI 通常比文字更容易。
*   請務必提供適當的文字來描述您的圖片。沒有視力的讀者無法看到您的圖片，仍然需要理解內容！請參閱下面的 alt 文字最佳實踐。

## 表格

在表格有意義時使用它們：用於呈現需要快速掃描的表格數據。

避免在可以使用列表輕鬆呈現數據時使用表格。列表在 Markdown 中更容易編寫和閱讀。

例如：

```markdown
不要這樣做

水果  | 指標      | 生長於 | 銳角曲率    | 屬性                                                                                                  | 備註
------ | ------------ | -------- | ------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------
蘋果  | 非常受歡迎 | 樹木    |                    | [多汁](http://cs/SomeReallyReallyReallyReallyReallyReallyReallyReallyLongQuery), 堅實, 甜美               | 蘋果讓醫生遠離。
香蕉 | 非常受歡迎 | 樹木    | 平均 16 度 | [方便](http://cs/SomeDifferentReallyReallyReallyReallyReallyReallyReallyReallyLongQuery), 柔軟, 甜美 | 與普遍的看法相反，大多數猿類更喜歡芒果。你不覺得嗎？請參閱 [設計文檔][banana_v2]，了解 bananiels 的最新熱門資訊。
```

此表格說明了一些典型的問題：

*   **分佈不良**：多個列在各行之間沒有差異，並且某些單元格為空。這通常表明您的數據可能無法從表格顯示中受益。

*   **不平衡的維度**：相對於列而言，行數很少。當此比率在任一方向上不平衡時，表格幾乎只會成為一種不靈活的文本格式。

*   某些單元格中的**冗長散文**。表格應該一目了然地講述一個簡潔的故事。

[列表](#lists) 和子標題有時足以呈現相同的資訊。讓我們以列表形式查看此數據：

```markdown
## 水果

這兩種水果都非常受歡迎、甜美，並且生長在樹上。

### 蘋果

*   [多汁](http://SomeReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyLongURL)
*   堅實

蘋果讓醫生遠離。
```
### 香蕉

*   [方便](http://cs/SomeDifferentReallyReallyReallyReallyReallyReallyReallyReallyLongQuery)
*   柔軟
*   平均銳角曲率 16 度。

與普遍的看法相反，大多數猿類更喜歡芒果。 你不覺得嗎？

請參閱 [設計文檔][banana_v2]，了解 bananiels 最新的熱門資訊。

```

列表形式更寬敞，因此可以說更容易讓讀者在這種情況下找到她感興趣的內容。

但是，有時表格是最佳選擇。 當您有：

*   相對均勻的跨兩個維度的數據分佈。
*   許多具有不同屬性的平行項目。

在這些情況下，表格格式正是您所需要的。 事實上，緊湊的表格可以提高可讀性：

```markdown
交通工具        | 受益者     | 優點
---------------- | -------------- | -----------------------------------------------
燕子          | 椰子       | [未載貨時速度快][airspeed]
自行車          | 格爾奇小姐     | [防風雨][tornado_proofing]
X-34 陸地飛艇 | 愛抱怨的農家子弟 | [便宜][tosche_station]，因為 X-38 出現了

[airspeed]: http://google3/airspeed.h
[tornado_proofing]: http://google3/kansas/
[tosche_station]: http://google3/power_converter.h
```

請注意，[參考連結](#reference-links) 用於保持表格單元格的可管理性。

## 強烈建議使用 Markdown 而不是 HTML

請盡可能使用標準 Markdown 語法，並避免使用 HTML hack。 如果您似乎無法完成您想要做的事情，請重新考慮您是否真的需要它。 除了 [大型表格](#tables) 之外，Markdown 幾乎可以滿足所有需求。

每一點 HTML hack 都會降低我們 Markdown 語料庫的可讀性和可移植性。 這反過來限制了與其他工具集成的有用性，這些工具可能會將源代碼呈現為純文本或渲染它。 請參閱 [哲學](philosophy.md)。

Gitiles 不會渲染 HTML。
