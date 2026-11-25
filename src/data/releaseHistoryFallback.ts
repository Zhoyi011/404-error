export interface ReleaseChangelogSections {
  added: string[];
  improved: string[];
  fixed: string[];
}

export interface ParsedReleaseNotesResult {
  summary?: string;
  sections?: ReleaseChangelogSections;
  changelog: string[];
}

export interface CuratedChineseReleaseTemplate {
  version: string;
  name: string;
  releaseDate: string;
  summary: string;
  sections: ReleaseChangelogSections;
}

const DEFAULT_FALLBACK_LINE = '优化客户端运行性能与本地离线体验，建议及时更新。';

function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function cleanInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
    .replace(/\(\s*#\d+\s*\)/g, '')
    .replace(/\b[0-9a-f]{7,40}\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes and translates legacy raw English git commit lines into readable
 * Simplified Chinese so historical releases never expose raw commit jargon.
 */
export function humanizeReleaseLine(rawLine: string): {
  category: keyof ReleaseChangelogSections;
  text: string;
} | null {
  const cleaned = cleanInlineMarkdown(rawLine)
    .replace(/^[-*+•]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .trim();

  if (!cleaned) return null;
  if (/^merge (pull request|branch|remote-tracking)/i.test(cleaned)) return null;
  if (/^#{1,6}\s*/.test(cleaned)) return null;
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(cleaned)) return null;

  const prefixMatch = cleaned.match(
    /^(feat|fix|chore|ci|build|docs|refactor|perf|style|test|revert)(?:\(([^)]+)\))?!?:\s*(.+)$/i
  );

  const commitType = prefixMatch ? prefixMatch[1].toLowerCase() : '';
  const commitScope = prefixMatch && prefixMatch[2] ? prefixMatch[2].toLowerCase() : '';
  const body = (prefixMatch ? prefixMatch[3] : cleaned).trim();
  const lower = `${commitScope} ${body}`.toLowerCase();

  let category: keyof ReleaseChangelogSections = 'improved';
  if (commitType === 'feat' || /^(新增|增加|支持|扩展|上线)/.test(body)) {
    category = 'added';
  } else if (
    commitType === 'fix' ||
    commitType === 'revert' ||
    /^(修复|解决|修正|处理|避免)/.test(body)
  ) {
    category = 'fixed';
  }

  // Already readable Simplified Chinese without raw code/CI patterns
  if (
    containsChinese(body) &&
    !prefixMatch &&
    !/yaml|workflow|esbuild|sdkmanager|keystore|vite@/i.test(body)
  ) {
    return { category, text: body };
  }

  if (containsChinese(body) && prefixMatch) {
    // Strip conventional prefix from Chinese commit message
    if (!/yaml|workflow|esbuild|sdkmanager|keystore|vite@/i.test(body)) {
      return { category, text: body };
    }
  }

  if (/linux|appimage|\.deb/.test(lower)) {
    return {
      category: category === 'fixed' ? 'fixed' : 'added',
      text: '支持并完善 Linux 桌面端（AppImage 与 .deb）自动构建与更新分流。',
    };
  }
  if (/windows|nsis|portable|\.exe/.test(lower) && /build|release|ci|exe|workflow|tauri/.test(lower)) {
    return {
      category: category === 'fixed' ? 'fixed' : 'improved',
      text: '优化 Windows 安装版与绿色便携版（.exe）客户端打包及自动发布流程。',
    };
  }
  if (/android|apk|capacitor|keystore|sdkmanager|sdk/.test(lower)) {
    return {
      category: 'fixed',
      text: '完善 Android 客户端（.apk）打包环境与签名流程，提升安装包兼容性。',
    };
  }
  if (/changelog|release notes|history|version\.json|updater|gemini/.test(lower)) {
    return {
      category: 'added',
      text: '升级版本更新日志与历史记录展示，提供清晰中文说明与离线兜底支持。',
    };
  }
  if (/download|os|detect/.test(lower)) {
    return {
      category: 'improved',
      text: '强化网页端下载体验，自动识别当前操作系统并智能推荐匹配安装包。',
    };
  }
  if (/ending|#17|50/.test(lower)) {
    return {
      category: /17|fix/.test(lower) ? 'fixed' : 'added',
      text: /17/.test(lower)
        ? '修复 #17 结局触发条件与线索衔接，补充完整解锁流程。'
        : '扩展多分支结局收集内容，补充更多条件触发结局与交互细节。',
    };
  }
  if (/sanity|flash|flicker/.test(lower)) {
    return {
      category: 'improved',
      text: '进入剧情后自动停止高频理智闪烁效果，提升长剧情阅读舒适度。',
    };
  }
  if (/mobile|phone|viewport|responsive/.test(lower)) {
    return {
      category: 'improved',
      text: '优化手机端专属叙事文本、触控热区与多视口自适应排版。',
    };
  }
  if (/setting|battery|storage|terminal|shop|store/.test(lower)) {
    return {
      category: 'added',
      text: '优化系统设置菜单与下拉交互，扩展电量、存储、终端及商店玩法内容。',
    };
  }
  if (/esbuild|vite|dependency|eresolve|npm|yaml|workflow|release\.yml/.test(lower)) {
    return {
      category: 'fixed',
      text: '修复客户端构建依赖与自动化发布流程配置问题，提升版本打包稳定性。',
    };
  }

  if (containsChinese(body)) {
    return { category, text: body };
  }

  if (commitType === 'fix') {
    return { category: 'fixed', text: '修复已知异常问题并提升客户端运行稳定性。' };
  }
  if (commitType === 'feat') {
    return { category: 'added', text: '推出新版本功能升级与跨平台体验优化。' };
  }
  return { category: 'improved', text: '优化客户端性能表现与基础运行环境稳定性。' };
}

function dedupeStrings(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function parseStructuredReleaseNotes(
  rawBody?: string,
  existingChangelog?: string[],
  existingSections?: Partial<ReleaseChangelogSections>,
  existingSummary?: string
): ParsedReleaseNotesResult {
  const cleanSummary = existingSummary ? cleanInlineMarkdown(existingSummary) : undefined;

  if (existingSections) {
    const added = dedupeStrings(
      (existingSections.added || [])
        .map((line) => humanizeReleaseLine(line)?.text || '')
        .filter(Boolean)
    );
    const improved = dedupeStrings(
      (existingSections.improved || [])
        .map((line) => humanizeReleaseLine(line)?.text || '')
        .filter(Boolean)
    );
    const fixed = dedupeStrings(
      (existingSections.fixed || [])
        .map((line) => humanizeReleaseLine(line)?.text || '')
        .filter(Boolean)
    );
    const combined = dedupeStrings([...added, ...improved, ...fixed]);
    if (combined.length > 0) {
      return {
        summary: cleanSummary,
        sections: { added, improved, fixed },
        changelog: combined,
      };
    }
  }

  if (Array.isArray(existingChangelog) && existingChangelog.length > 0) {
    const sanitized = dedupeStrings(
      existingChangelog
        .map((line) => humanizeReleaseLine(line)?.text || '')
        .filter(Boolean)
    );
    if (sanitized.length > 0) {
      return {
        summary: cleanSummary,
        changelog: sanitized,
      };
    }
  }

  if (!rawBody || !rawBody.trim()) {
    return {
      summary: cleanSummary,
      changelog: [DEFAULT_FALLBACK_LINE],
    };
  }

  const lines = rawBody.split(/\r?\n/);
  const sections: ReleaseChangelogSections = {
    added: [],
    improved: [],
    fixed: [],
  };
  const flatItems: string[] = [];
  let activeHeading: keyof ReleaseChangelogSections | null = null;
  let parsedSummary = cleanSummary;
  let hasExplicitHeadings = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (/^#{1,6}\s*安装包说明/i.test(trimmed)) break;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) continue;

    if (/^#{1,6}\s*/.test(trimmed) && !/^-\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,6}\s*/, '').trim();
      if (!heading || /^伪人入侵\s*v?/i.test(heading)) continue;
      if (/新增功能|新特性|features?/i.test(heading)) {
        activeHeading = 'added';
        hasExplicitHeadings = true;
        continue;
      }
      if (/优化体验|体验优化|改进|improvements?|enhancements?/i.test(heading)) {
        activeHeading = 'improved';
        hasExplicitHeadings = true;
        continue;
      }
      if (/问题修复|缺陷修复|bug\s*fixes?|fixes?/i.test(heading)) {
        activeHeading = 'fixed';
        hasExplicitHeadings = true;
        continue;
      }
      activeHeading = null;
      continue;
    }

    // Overview sentence appearing before bullet lists/headings
    if (
      !activeHeading &&
      flatItems.length === 0 &&
      !/^[-*+•]\s+/.test(trimmed) &&
      !/^\d+[.)]\s+/.test(trimmed) &&
      containsChinese(trimmed) &&
      !/^(feat|fix|chore|ci|build|docs|refactor|perf):/i.test(trimmed)
    ) {
      if (!parsedSummary) {
        parsedSummary = cleanInlineMarkdown(trimmed);
      }
      continue;
    }

    const translated = humanizeReleaseLine(trimmed);
    if (!translated) continue;
    const targetCategory = activeHeading || translated.category;
    sections[targetCategory].push(translated.text);
    flatItems.push(translated.text);
  }

  sections.added = dedupeStrings(sections.added);
  sections.improved = dedupeStrings(sections.improved);
  sections.fixed = dedupeStrings(sections.fixed);
  const changelog = dedupeStrings(
    hasExplicitHeadings
      ? [...sections.added, ...sections.improved, ...sections.fixed]
      : flatItems
  );

  return {
    summary: parsedSummary,
    sections:
      sections.added.length + sections.improved.length + sections.fixed.length > 0
        ? sections
        : undefined,
    changelog: changelog.length > 0 ? changelog : [DEFAULT_FALLBACK_LINE],
  };
}

export const CURATED_CHINESE_RELEASES: Record<string, CuratedChineseReleaseTemplate> = {
  '1.0.0': {
    version: '1.0.0',
    name: '伪人入侵 v1.0.0',
    releaseDate: '2026-01-01T00:00:00.000Z',
    summary: '首个全平台正式版上线，完整收录双端虚拟系统调查玩法与离线支持。',
    sections: {
      added: [
        '推出仿 Windows 11 桌面系统与模拟移动端双视角心理恐怖解谜体验。',
        '实装 Wiki 线索库、终端诊断命令与安全中心联动机制。',
        '支持 PWA 离线运行及 Windows / Linux / Android 独立客户端构建。',
      ],
      improved: [
        '针对手机竖屏、横屏小窗与桌面宽屏优化多设备界面排版。',
      ],
      fixed: [],
    },
  },
};

export function buildBaselineLatestTemplate(localVersion: string): CuratedChineseReleaseTemplate {
  return {
    version: localVersion,
    name: `伪人入侵 v${localVersion}`,
    releaseDate: '2026-11-25T00:00:00.000Z',
    summary:
      '全面扩展全平台发行与历史日志体验，新增多结局内容与系统设置优化。',
    sections: {
      added: [
        '支持 Windows (.exe 安装版/便携版)、Linux (.AppImage / .deb) 与 Android (.apk) 多端自动构建与更新分流。',
        '新增「版本更新历史记录」与当次更新说明展示，并内置全中文更新日志与离线兜底数据。',
        '网页版下载弹窗支持自动检测当前操作系统，智能推荐匹配格式安装包。',
        '全结局数量扩充至 50 个，新增电量、存储异常等触发事件并扩展终端与商店功能。',
      ],
      improved: [
        '进入剧情演出后自动关闭理智下降屏幕闪烁，大幅提升长剧情阅读舒适度。',
        '优化系统设置下拉选项交互，并细化移动端专属文案与触控适配细节。',
      ],
      fixed: [
        '修复 #17 结局触发条件与判定逻辑，确保线索集齐后可稳定解锁。',
      ],
    },
  };
}
