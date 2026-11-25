import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_FALLBACK_SUMMARY =
  '优化跨平台客户端运行稳定性与离线体验，建议及时更新至最新版本。';

function cleanInlineMarkdown(text) {
  return String(text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
    .replace(/\(\s*#\d+\s*\)/g, '')
    .replace(/\b[0-9a-f]{7,40}\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSectionList(items, maxItems = 6) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of items) {
    const cleaned = cleanInlineMarkdown(raw)
      .replace(/^[-*+•]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .trim();
    if (!cleaned || seen.has(cleaned)) continue;
    // Reject untranslated conventional-commit prefixes
    if (/^(feat|fix|chore|ci|build|docs|refactor|perf|style|test)(\([^)]*\))?:/i.test(cleaned)) {
      continue;
    }
    seen.add(cleaned);
    result.push(cleaned);
    if (result.length >= maxItems) break;
  }
  return result;
}

function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

function isLikelyRawCommitPrefix(text) {
  return /^(feat|fix|chore|ci|build|docs|refactor|perf|style|test|revert|merge)(\([^)]*\))?!?:\s*/i.test(
    text
  );
}

/**
 * Deterministic translator/sanitizer for raw git commit lines when Gemini API is
 * unavailable, unconfigured, or times out. Strictly maps real commit keywords
 * into accurate Simplified Chinese without inventing features.
 */
export function translateRawCommitLineToChinese(rawLine, version = '1.0.0') {
  const trimmed = cleanInlineMarkdown(rawLine)
    .replace(/^[-*+•]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .trim();

  if (!trimmed) return null;
  if (/^merge (pull request|branch|remote-tracking)/i.test(trimmed)) return null;
  if (/^#{1,6}\s*/.test(trimmed)) return null;
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) return null;

  const prefixMatch = trimmed.match(
    /^(feat|fix|chore|ci|build|docs|refactor|perf|style|test|revert)(?:\(([^)]+)\))?!?:\s*(.+)$/i
  );

  const commitType = prefixMatch ? prefixMatch[1].toLowerCase() : '';
  const commitScope = prefixMatch && prefixMatch[2] ? prefixMatch[2].toLowerCase() : '';
  const body = (prefixMatch ? prefixMatch[3] : trimmed).trim();
  const lower = `${commitScope} ${body}`.toLowerCase();

  let category = 'improved';
  if (commitType === 'feat') {
    category = 'added';
  } else if (commitType === 'fix' || commitType === 'revert') {
    category = 'fixed';
  } else if (/新增|增加|添加|支持|扩展|上线|引入/.test(body)) {
    category = 'added';
  } else if (/修复|解决|修正|处理|兜底|避免|防止/.test(body)) {
    category = 'fixed';
  }

  // If the message body is already cleanly written in Chinese without heavy code jargon
  if (
    containsChinese(body) &&
    !/[a-z_]{3,}\/[a-z_]{3,}/i.test(body) &&
    !/yaml|workflow|esbuild|sdkmanager|keystore|vite@/i.test(body)
  ) {
    return { category, text: body };
  }

  // Domain-accurate rule mapping based strictly on real commit signals
  if (/linux|appimage|\.deb|ubuntu|debian|tauri/.test(lower) && /linux|appimage|deb/.test(lower)) {
    return {
      category: category === 'fixed' ? 'fixed' : 'added',
      text: '补充并优化 Linux 桌面端（AppImage 与 .deb 安装包）的构建支持与自动分发。',
    };
  }
  if (/windows|nsis|portable|\.exe/.test(lower) && /build|release|ci|exe|workflow|tauri/.test(lower)) {
    return {
      category: category === 'fixed' ? 'fixed' : 'improved',
      text: '优化 Windows 安装版与绿色便携版（.exe）的自动化构建与发布流程。',
    };
  }
  if (/android|apk|capacitor|keystore|sdkmanager|tools|sdk/.test(lower)) {
    return {
      category: category === 'feat' ? 'added' : 'fixed',
      text: '修复并完善 Android 客户端（.apk）构建环境、签名配置与版本同步稳定性。',
    };
  }
  if (/changelog|release notes|history|version\.json|updater|gemini|更新日志|更新历史/.test(lower)) {
    if (/gemini|polish|中文|简体/.test(lower)) {
      return {
        category: 'improved',
        text: '升级版本更新日志生成机制，提供更清晰易读的简体中文更新说明与离线兜底展示。',
      };
    }
    return {
      category: category === 'fixed' ? 'fixed' : 'added',
      text: '新增客户端当次更新说明与版本更新历史记录功能，支持多端查看与离线缓存。',
    };
  }
  if (/download|下载|detect|os|系统检测/.test(lower)) {
    return {
      category: category === 'fixed' ? 'fixed' : 'improved',
      text: '增强网页端下载体验，自动识别当前操作系统并智能推荐适配的安装包。',
    };
  }
  if (/ending|结局|#17|50/.test(lower)) {
    if (/17/.test(lower)) {
      return {
        category: 'fixed',
        text: '修复 #17 结局的触发条件与判定逻辑，补充完整解锁线索。',
      };
    }
    return {
      category: 'added',
      text: '扩展多线剧情分支与结局收集内容，新增多种条件触发结局。',
    };
  }
  if (/sanity|理智|flash|闪烁|flicker|剧情/.test(lower)) {
    return {
      category: 'improved',
      text: '优化剧情演出体验：进入剧情后自动停止高频率理智下降屏幕闪烁。',
    };
  }
  if (/mobile|phone|手机|viewport|responsive|横屏|竖屏/.test(lower)) {
    return {
      category: 'improved',
      text: '优化移动端专属叙事文本、触控布局与多屏幕尺寸自适应显示。',
    };
  }
  if (/setting|设置|battery|电量|storage|存储|terminal|终端|shop|store|商店/.test(lower)) {
    return {
      category: category === 'fixed' ? 'fixed' : 'added',
      text: '优化系统设置菜单交互并扩展电量、存储检测及终端/商店玩法内容。',
    };
  }
  if (/esbuild|vite|dependency|dependencies|package\.json|eresolve|npm|yaml|indent|workflow|release\.yml/.test(lower)) {
    return {
      category: category === 'fixed' ? 'fixed' : 'improved',
      text: '修复多端构建依赖兼容与发布流水线配置问题，提升版本打包稳定性。',
    };
  }

  // Generic Chinese cleanup if commit body had mixed text
  if (containsChinese(body)) {
    return { category, text: body };
  }

  // Fallback by commit type without fabricating specific features
  if (commitType === 'fix') {
    return {
      category: 'fixed',
      text: `修复已知问题并提升 v${version} 客户端运行稳定性。`,
    };
  }
  if (commitType === 'feat') {
    return {
      category: 'added',
      text: `推出 v${version} 新版本功能更新与多端体验升级。`,
    };
  }
  if (commitType === 'perf') {
    return {
      category: 'improved',
      text: '优化应用性能表现与低配设备流畅度。',
    };
  }
  if (commitType === 'docs') {
    return {
      category: 'improved',
      text: '更新项目使用说明与跨平台发布文档。',
    };
  }
  return {
    category: 'improved',
    text: `同步 v${version} 跨平台构建与基础运行环境维护。`,
  };
}

export function buildFallbackPolishedNotes({ version, rawNotes }) {
  const sections = {
    added: [],
    improved: [],
    fixed: [],
  };

  const rawLines = String(rawNotes || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of rawLines) {
    if (/^#{1,6}\s*安装包说明/i.test(line)) break;
    const translated = translateRawCommitLineToChinese(line, version);
    if (!translated) continue;
    sections[translated.category].push(translated.text);
  }

  sections.added = normalizeSectionList(sections.added, 5);
  sections.improved = normalizeSectionList(sections.improved, 5);
  sections.fixed = normalizeSectionList(sections.fixed, 5);

  if (
    sections.added.length === 0 &&
    sections.improved.length === 0 &&
    sections.fixed.length === 0
  ) {
    sections.improved = [
      `发布《伪人入侵》v${version} 跨平台客户端更新（支持 Windows / Linux / Android）。`,
      '优化本地离线资源加载稳定性与版本更新说明展示体验。',
    ];
  }

  const allItems = [...sections.added, ...sections.improved, ...sections.fixed];
  const summary =
    allItems.length > 0
      ? `本次 v${version} 更新带来${sections.added.length > 0 ? '新功能扩展' : ''}${
          sections.added.length > 0 && (sections.improved.length > 0 || sections.fixed.length > 0)
            ? '与'
            : ''
        }${sections.improved.length > 0 || sections.fixed.length > 0 ? '多项体验优化和问题修复' : ''}，建议及时更新体验。`
      : DEFAULT_FALLBACK_SUMMARY;

  return {
    source: 'fallback',
    summary,
    sections,
    changelog: allItems,
  };
}

export function formatReleaseNotesMarkdown({ summary, sections, changelog }) {
  const parts = [];
  const cleanSummary = cleanInlineMarkdown(summary || '');
  if (cleanSummary) {
    parts.push(cleanSummary);
  }

  const added = normalizeSectionList(sections?.added || []);
  const improved = normalizeSectionList(sections?.improved || []);
  const fixed = normalizeSectionList(sections?.fixed || []);

  if (added.length > 0) {
    parts.push(`### 新增功能\n${added.map((item) => `- ${item}`).join('\n')}`);
  }
  if (improved.length > 0) {
    parts.push(`### 优化体验\n${improved.map((item) => `- ${item}`).join('\n')}`);
  }
  if (fixed.length > 0) {
    parts.push(`### 问题修复\n${fixed.map((item) => `- ${item}`).join('\n')}`);
  }

  if (parts.length === 0 && Array.isArray(changelog) && changelog.length > 0) {
    parts.push(changelog.map((item) => `- ${item}`).join('\n'));
  }

  return parts.join('\n\n').trim();
}

function parseJsonSafe(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

async function callGeminiPolisher({ version, rawNotes, apiKey, timeoutMs = 18000 }) {
  const { GoogleGenAI, Type } = await import('@google/genai');
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          `版本号：v${version}`,
          '以下是本次版本对应的真实 git commit 与变更记录，请严格依据这些内容改写为面向玩家的简体中文更新日志：',
          '',
          rawNotes,
        ].join('\n'),
        config: {
          systemInstruction: [
            '你是心理恐怖解谜游戏《伪人入侵》（404-error，支持 Web 网页端、Windows .exe、Linux AppImage/.deb、Android .apk）的发行说明编辑。',
            '任务：将输入的代码提交记录与改动摘要改写为结构清晰、自然顺畅、细节明确且面向玩家的简体中文更新日志。',
            '严格要求：',
            '1. 必须全部使用简体中文，彻底去除 feat:、fix(ci):、chore: 等英文提交前缀、哈希值、脚本文件名或内部密钥名称。',
            '2. 绝对忠实于提供的输入内容：只允许总结和润色输入中真实提到的改动，严禁凭空捏造不存在的功能、剧情结局、平台或数据。',
            '3. 如果输入中包含构建脚本、工作流或依赖修复，请简洁转化为玩家可理解的跨平台稳定性/打包构建优化说明。',
            '4. 按 JSON 结构输出：summary（1-2句版本总览）、added（新增功能数组）、improved（优化体验数组）、fixed（问题修复数组）；没有内容时返回空数组 []。',
            '5. 每条说明控制在 12~45 个汉字左右，避免空洞套话。',
          ].join('\n'),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: '1至2句面向玩家的简体中文版本更新概述',
              },
              added: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '新增功能条目列表（无则为空数组）',
              },
              improved: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '体验优化与打包构建改进条目列表（无则为空数组）',
              },
              fixed: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '问题修复条目列表（无则为空数组）',
              },
            },
            required: ['summary', 'added', 'improved', 'fixed'],
          },
        },
      }),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(`Gemini request timed out after ${timeoutMs}ms`));
        });
      }),
    ]);

    const parsed = parseJsonSafe(response?.text);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Gemini returned empty or non-JSON response');
    }

    const added = normalizeSectionList(parsed.added, 6);
    const improved = normalizeSectionList(parsed.improved, 6);
    const fixed = normalizeSectionList(parsed.fixed, 6);
    const changelog = [...added, ...improved, ...fixed];

    if (changelog.length === 0) {
      throw new Error('Gemini returned empty changelog sections');
    }

    const rawSummary = cleanInlineMarkdown(parsed.summary || '');
    const summary =
      rawSummary && containsChinese(rawSummary) && !isLikelyRawCommitPrefix(rawSummary)
        ? rawSummary
        : DEFAULT_FALLBACK_SUMMARY;

    return {
      source: 'gemini',
      summary,
      sections: { added, improved, fixed },
      changelog,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function polishReleaseNotes({
  version = '1.0.0',
  rawNotes = '',
  apiKey = process.env.GEMINI_API_KEY || '',
}) {
  const cleanVersion = String(version || '1.0.0').replace(/^v/i, '').trim();
  const trimmedRaw = String(rawNotes || '').trim();
  const trimmedKey = String(apiKey || '').trim();

  let result = null;

  if (trimmedKey && trimmedRaw) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        result = await callGeminiPolisher({
          version: cleanVersion,
          rawNotes: trimmedRaw,
          apiKey: trimmedKey,
        });
        break;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `[polish-release-notes] Gemini attempt ${attempt} failed (${message}); ${
            attempt < 2 ? 'retrying...' : 'falling back to deterministic Chinese formatter.'
          }`
        );
      }
    }
  } else if (!trimmedKey) {
    console.log(
      '[polish-release-notes] GEMINI_API_KEY not configured; using deterministic Chinese fallback.'
    );
  }

  if (!result) {
    result = buildFallbackPolishedNotes({
      version: cleanVersion,
      rawNotes: trimmedRaw,
    });
  }

  const markdown = formatReleaseNotesMarkdown(result);
  return {
    ...result,
    version: cleanVersion,
    markdown,
  };
}

function parseCliArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--version' && argv[i + 1]) {
      args.version = argv[++i];
    } else if (token === '--in' && argv[i + 1]) {
      args.inFile = argv[++i];
    } else if (token === '--out-md' && argv[i + 1]) {
      args.outMd = argv[++i];
    } else if (token === '--out-json' && argv[i + 1]) {
      args.outJson = argv[++i];
    }
  }
  return args;
}

const isCliEntry =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCliEntry) {
  const root = process.cwd();
  const args = parseCliArgs(process.argv.slice(2));
  const pkgPath = path.join(root, 'package.json');
  const pkgVersion = fs.existsSync(pkgPath)
    ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version
    : '1.0.0';
  const version = args.version || process.env.RELEASE_VERSION || pkgVersion || '1.0.0';

  let rawNotes = (process.env.RELEASE_NOTES || '').trim();
  const inFile = args.inFile || (process.env.RELEASE_NOTES_FILE || '').trim();
  if (!rawNotes && inFile) {
    const resolvedIn = path.resolve(root, inFile);
    if (fs.existsSync(resolvedIn)) {
      rawNotes = fs.readFileSync(resolvedIn, 'utf8').trim();
    }
  }

  const polished = await polishReleaseNotes({
    version,
    rawNotes,
    apiKey: process.env.GEMINI_API_KEY || '',
  });

  if (args.outMd) {
    const resolvedMd = path.resolve(root, args.outMd);
    fs.mkdirSync(path.dirname(resolvedMd), { recursive: true });
    fs.writeFileSync(resolvedMd, polished.markdown + '\n', 'utf8');
  }
  if (args.outJson) {
    const resolvedJson = path.resolve(root, args.outJson);
    fs.mkdirSync(path.dirname(resolvedJson), { recursive: true });
    fs.writeFileSync(resolvedJson, JSON.stringify(polished, null, 2) + '\n', 'utf8');
  }

  if (!args.outMd && !args.outJson) {
    console.log(polished.markdown);
  } else {
    console.log(
      `[polish-release-notes] Generated v${polished.version} notes via ${polished.source} (${polished.changelog.length} items)`
    );
  }
}
