---
publish: false
---

# CLAUDE.md

本仓库是一个技术博客，用 VitePress + @sugarat/theme 构建，文章在 `posts/`。下面是给在这个仓库工作的 AI 助手的全局要求。

## 去除回答中的 AI 味（最高优先级，适用于所有产出）

无论写博客文章、改文档、写代码注释、写 commit message，还是普通对话回复，产出都不能有 AI 生成的工整感。这是作者反复强调的底线，优先级高于默认行为。

**核心要求：**

- **观点融在叙述里**，不另起一段讲"我的观点是"。立场从措辞、选材、轻重、对比里透出来。
- **段落长短交错**。不写每段等长、每个列表硬凑三项的对称结构。该 2 条就 2 条，该 7 条就 7 条。
- **删套话**。"此外""值得注意的是""总而言之""接下来我们来看""随着 XX 的发展"这类承上启下和空洞开头，能删就删，直接进内容。
- **敢取舍、敢下判断**。不写"各有优劣，看需求"这种和稀泥结论。该略过的略过，该表态的表态。
- **措辞书面但不文言**。用现代书面表达，不用"皆须""亦""之"连用的半文半白；不用"根子""卡手""喂熟""虚火重""鸡同鸭讲"这类方言口语和生造比喻。
- **破折号克制**。一篇文章里 `——` 不超过三五个，多用逗号和分句代替。

**写完自检：读出声来，像现代成年人写的书面文字，还是像客服在念稿子？像后者就改。**

详细规则见：
- `blog-writing` skill 的"去 AI 感""AI 词汇与句式黑名单""文风的度"三节（写博客时必读）
- `humanizer-zh` skill（需要深度审稿时调用，含 24 种 AI 写作模式与改写示例）

## 其他全局要求

- **会变的事实先核验**。版本号、价格、API 地址、配置字段不凭记忆写，联网查证；核不到的标注"以官方文档为准"，不写成既成事实。
- **改旧文先读全文**。不要局部盲改，避免引入前后矛盾、引用悬空、重复内容没合并。
- **分开提交**。一个 commit 只干一件事，新文章 `feat:`、改文档 `docs:`/`refactor:`、运维 `chore:`/`fix:`。
- **构建验证**。改完跑 `pnpm build` 确认无语法错误。

写博客时，先按 `blog-writing` skill 校准风格与格式，再动笔。

<!-- BEGIN brain.md -->
## Project Brain

This project keeps a **Project Brain**: a persistent memory layer of its durable decisions, requirements, and constraints. Read `./BRAIN.md` for the full read/write contract.
@import ./BRAIN.md

Maintain the brain as part of normal coding work — not as a separate task. While discussing or implementing features:
- **Start of a task:** load relevant context with the `brain` CLI (`list-pages`, `read-page`, `read-root`). Prefer a narrow read over scanning everything.
- **When a decision, requirement, constraint, or durable insight settles** (in chat or while coding): capture it immediately via the `brain` CLI. Do not wait to be asked and do not batch it for later.
- **Pure implementation with no new decision:** do not write to the brain.
- **When overturning a prior conclusion:** update the page (`update-truth` and/or `append-timeline` with `kind: reversal`, or `archive-page`).
- Only store what will still matter in six months and is hard to reconstruct from the code alone.
- All reads and writes go through the `brain` CLI — never hand-edit brain files.

The brain skills (`brain-setup`, `brain-page`, `brain-ingest`, `brain-bootstrap`) are installed in your global skills directory. Prefer `brain init` to scaffold a new project.
<!-- END brain.md -->
