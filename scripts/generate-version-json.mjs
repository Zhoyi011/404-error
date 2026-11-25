import fs from 'node:fs';
import path from 'node:path';
import {
  buildFallbackPolishedNotes,
  formatReleaseNotesMarkdown,
  polishReleaseNotes,
} from './polish-release-notes.mjs';

const REPO = 'Zhoyi011/404-error';
const RELEASE_BASE = `https://github.com/${REPO}/releases/latest/download`;

function readRawNotes(root) {
  const inlineNotes = (process.env.RELEASE_NOTES || '').trim();
  if (inlineNotes) return inlineNotes;

  const notesFile = (process.env.RELEASE_NOTES_FILE || '').trim();
  if (notesFile) {
    const resolved = path.resolve(root, notesFile);
    if (fs.existsSync(resolved)) {
      return fs.readFileSync(resolved, 'utf8').trim();
    }
  }
  return '';
}

function readPrePolishedNotes(root) {
  const jsonFile = (process.env.POLISHED_NOTES_JSON_FILE || '').trim();
  if (!jsonFile) return null;
  const resolved = path.resolve(root, jsonFile);
  if (!fs.existsSync(resolved)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    if (parsed && Array.isArray(parsed.changelog) && parsed.changelog.length > 0) {
      return {
        source: parsed.source || 'gemini',
        summary: parsed.summary || '',
        sections: parsed.sections || { added: [], improved: [], fixed: [] },
        changelog: parsed.changelog,
        markdown: parsed.markdown || formatReleaseNotesMarkdown(parsed),
      };
    }
  } catch {
    return null;
  }
  return null;
}

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = (process.env.RELEASE_VERSION || pkg.version || '1.0.0').replace(/^v/, '').trim();
const rawNotes = readRawNotes(root);

let polished = readPrePolishedNotes(root);
if (!polished) {
  try {
    polished = await polishReleaseNotes({
      version,
      rawNotes,
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  } catch (err) {
    console.warn(
      '[generate-version-json] Unexpected polishing error, falling back:',
      err instanceof Error ? err.message : String(err)
    );
    const fallback = buildFallbackPolishedNotes({ version, rawNotes });
    polished = {
      ...fallback,
      markdown: formatReleaseNotesMarkdown(fallback),
    };
  }
}

const outPath = path.resolve(root, process.argv[2] || 'version.json');
const outMdPath = (process.env.OUT_RELEASE_NOTES_MD || '').trim();

if (outMdPath) {
  const resolvedMdPath = path.resolve(root, outMdPath);
  fs.mkdirSync(path.dirname(resolvedMdPath), { recursive: true });
  fs.writeFileSync(resolvedMdPath, polished.markdown + '\n', 'utf8');
  console.log(`Generated release notes markdown at ${resolvedMdPath} (source: ${polished.source})`);
}

const manifest = {
  version,
  tag: `v${version}`,
  name: `伪人入侵 v${version}`,
  releaseDate: new Date().toISOString(),
  summary: polished.summary,
  notes: polished.markdown || polished.changelog.map((item) => `- ${item}`).join('\n'),
  changelog: polished.changelog,
  sections: polished.sections,
  notesSource: polished.source,
  releaseUrl: `https://github.com/${REPO}/releases/tag/v${version}`,
  releasesApiUrl: `https://api.github.com/repos/${REPO}/releases`,
  repository: `https://github.com/${REPO}`,
  downloads: {
    windows: `${RELEASE_BASE}/404-error-windows.exe`,
    windowsPortable: `${RELEASE_BASE}/404-error-windows-portable.exe`,
    linuxAppImage: `${RELEASE_BASE}/404-error-linux.AppImage`,
    linuxDeb: `${RELEASE_BASE}/404-error-linux.deb`,
    android: `${RELEASE_BASE}/404-error-android.apk`,
  },
  platforms: {
    windows: {
      url: `${RELEASE_BASE}/404-error-windows.exe`,
      portableUrl: `${RELEASE_BASE}/404-error-windows-portable.exe`,
      fileName: '404-error-windows.exe',
    },
    linux: {
      appImageUrl: `${RELEASE_BASE}/404-error-linux.AppImage`,
      debUrl: `${RELEASE_BASE}/404-error-linux.deb`,
      appImageFileName: '404-error-linux.AppImage',
      debFileName: '404-error-linux.deb',
    },
    android: {
      url: `${RELEASE_BASE}/404-error-android.apk`,
      fileName: '404-error-android.apk',
    },
  },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `Generated ${path.relative(root, outPath)} for v${version} (${polished.changelog.length} changelog items via ${polished.source})`
);
