#!/usr/bin/env node
/**
 * PreToolUse 가드 — Edit / Write / MultiEdit 직전에 실행된다.
 *
 * 차단하는 것
 *   1. 자동 생성 파일 직접 수정       (orval generated/ · generate:icons · next typegen)
 *   2. FSD 레이어 위반 import          (상향 · cross-slice · 레이어를 넘는 상대경로)
 *   3. `@/shared/api/generated/...` 직접 참조 (shared/api 밖에서. 배럴 `@/shared/api`만 쓴다)
 *
 * 설계 메모
 * - Node 로 쓴 이유: Windows 환경이다. bash + jq 셸 훅은 jq 가 없으면 통째로 죽는다.
 * - **새로 쓰는 내용의 import 구문만** 본다. 기존 위반은 `pnpm lint`(steiger 포함)와 CI 가 잡는다.
 * - slice group 지원: `features/meeting/` 처럼 index.ts 없는 폴더는 그룹으로 보고
 *   그 아래 폴더(`features/meeting/create-meeting`)를 slice 로 판정한다.
 * - 내부 오류가 나면 막지 않고 통과시킨다(fail-open). 대신 stderr 에 남긴다.
 *
 * 규칙 문서: .claude/rules/import-convention.md · fsd-*.md
 */

import fs from 'node:fs';
import path from 'node:path';

/** apps/web/src 아래의 레이어. 숫자가 클수록 상위. 하위 → 상위 import 는 금지. */
const LAYERS = {
  shared: { num: 0, hasSlice: false },
  entities: { num: 1, hasSlice: true },
  features: { num: 2, hasSlice: true },
  widgets: { num: 3, hasSlice: true },
  _pages: { num: 4, hasSlice: true },
  _app: { num: 5, hasSlice: false },
};

/** 직접 수정하면 안 되는 자동 생성 산출물. [경로 조각, 재생성 방법] */
const GENERATED = [
  ['apps/web/src/shared/api/generated/', 'pnpm --filter @repo/web orval'],
  ['apps/web/src/shared/ui/icon/icons.generated.ts', 'pnpm generate:icons'],
  ['apps/web/next-env.d.ts', 'next typegen / build 가 생성'],
  ['apps/web/.next/', 'next typegen / build 가 생성'],
];

const WEB_SRC = 'apps/web/src/';
const WEB_APP = 'apps/web/app/';
const GENERATED_API = 'shared/api/generated';

function allow() {
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}

/** 백슬래시를 슬래시로 바꾼 절대 경로와, 저장소 기준 상대 경로(apps/...)를 함께 돌려준다. */
function normalize(filePath) {
  const posix = filePath.replace(/\\/g, '/');
  const idx = posix.indexOf('/apps/');
  return {
    abs: posix,
    rel: idx === -1 ? posix.replace(/^\/+/, '') : posix.slice(idx + 1),
  };
}

/** 그 폴더가 index.ts 없는 slice group 인가. (존재하지 않는 새 폴더는 group 이 아니다) */
function isSliceGroup(srcRoot, layer, name) {
  const dir = path.posix.join(srcRoot, layer, name);
  try {
    if (!fs.statSync(dir).isDirectory()) return false;
  } catch {
    return false;
  }
  return !fs.existsSync(path.posix.join(dir, 'index.ts'));
}

/**
 * apps/web/src 기준 경로에서 레이어와 슬라이스를 판정한다.
 * 레이어 밖(stories/, test-setup.ts 등)이면 null.
 */
function locate(relPath, srcRoot) {
  const [layer, second, third] = relPath.split('/');
  const meta = LAYERS[layer];
  if (!meta) return null;

  let slice = null;
  if (meta.hasSlice && second) {
    // 파일(확장자 있음)은 slice 가 아니다
    const looksLikeFile = /\.[a-z]+$/i.test(second);
    if (!looksLikeFile && third && isSliceGroup(srcRoot, layer, second)) {
      slice = `${second}/${third}`;
    } else if (!looksLikeFile) {
      slice = second;
    }
  }
  return { layer, num: meta.num, slice };
}

/** import 대상 문자열을 apps/web/src 기준 경로로 바꾼다. 외부 패키지면 null. */
function resolveTarget(spec, currentRelPath) {
  if (spec.startsWith('@/')) return spec.slice(2);
  if (spec.startsWith('.')) {
    const dir = path.posix.dirname(currentRelPath);
    return path.posix.normalize(path.posix.join(dir, spec));
  }
  return null;
}

/** 편집 내용에서 import 대상 목록을 뽑는다. */
function extractImports(content) {
  const specs = [];
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) specs.push(m[1]);
  }
  return specs;
}

function readContent(toolInput) {
  if (typeof toolInput.content === 'string') return toolInput.content;
  if (typeof toolInput.new_string === 'string') return toolInput.new_string;
  if (Array.isArray(toolInput.edits)) {
    return toolInput.edits.map((e) => e?.new_string ?? '').join('\n');
  }
  return '';
}

function generatedApiViolation(spec) {
  return (
    `생성 API 직접 참조: '${spec}'\n` +
    `    상위 레이어는 '@/shared/api' 배럴만 씁니다. 새 orval 태그면 shared/api/index.ts 에 re-export 를 추가하세요.`
  );
}

function main(input) {
  const toolInput = input.tool_input ?? {};
  const rawPath = toolInput.file_path;
  if (typeof rawPath !== 'string' || rawPath.length === 0) allow();

  const { abs, rel: filePath } = normalize(rawPath);

  // ── 1. 자동 생성 파일 차단 ──────────────────────────────────────────────
  for (const [fragment, howto] of GENERATED) {
    if (filePath.includes(fragment)) {
      deny(`자동 생성 파일은 직접 수정하지 않습니다: ${fragment}\n  · 재생성 방법: ${howto}`);
    }
  }

  if (!/\.(ts|tsx)$/.test(filePath)) allow();
  // 테스트·스토리는 여러 slice 를 조합하는 게 자연스러워 검사하지 않는다.
  if (/\.(test|stories)\.(ts|tsx)$/.test(filePath)) allow();

  const content = readContent(toolInput);
  if (content.length === 0) allow();

  // ── 2. Next 라우트(apps/web/app) — 최상위라 레이어 검사는 없고 generated 직접 참조만 본다
  if (filePath.includes(WEB_APP)) {
    const violations = extractImports(content)
      .filter((spec) => spec.startsWith(`@/${GENERATED_API}`))
      .map(generatedApiViolation);
    if (violations.length > 0) {
      deny(
        `import 규칙 위반 — ${filePath}\n` + violations.map((v, i) => `  ${i + 1}. ${v}`).join('\n')
      );
    }
    allow();
  }

  // ── 3. FSD 레이어 검사 (apps/web/src 의 ts/tsx) ─────────────────────────
  if (!filePath.includes(WEB_SRC)) allow();

  const srcRoot = abs.slice(0, abs.indexOf(WEB_SRC) + WEB_SRC.length);
  const relPath = filePath.slice(filePath.indexOf(WEB_SRC) + WEB_SRC.length);
  const current = locate(relPath, srcRoot);
  if (!current) allow();

  const isInsideSharedApi = relPath.startsWith('shared/api/');
  const violations = [];

  for (const spec of extractImports(content)) {
    const targetPath = resolveTarget(spec, relPath);
    if (!targetPath) continue;

    if (targetPath.startsWith(GENERATED_API) && !isInsideSharedApi) {
      violations.push(generatedApiViolation(spec));
      continue;
    }

    const target = locate(targetPath, srcRoot);
    if (!target) continue;

    if (target.num > current.num) {
      violations.push(
        `상향 import: ${current.layer}(${current.num}) → ${target.layer}(${target.num})   '${spec}'\n` +
          `    아래 레이어는 위 레이어를 참조할 수 없습니다. 공통이 필요하면 아래 레이어로 내리거나 상위가 주입하게 하세요.`
      );
      continue;
    }

    if (
      target.num === current.num &&
      current.slice &&
      target.slice &&
      current.slice !== target.slice
    ) {
      violations.push(
        `cross-slice import: ${current.layer}/${current.slice} → ${target.layer}/${target.slice}   '${spec}'\n` +
          `    같은 레이어의 다른 slice 를 직접 참조할 수 없습니다. 공통은 아래 레이어로 내리거나 상위에서 조합하세요.`
      );
      continue;
    }

    if (spec.startsWith('.') && target.layer !== current.layer) {
      violations.push(
        `레이어를 넘는 상대경로: '${spec}'\n` +
          `    다른 레이어는 '@/${target.layer}/...' 형태의 별칭으로 참조하세요.`
      );
    }
  }

  if (violations.length > 0) {
    deny(
      `FSD 레이어 위반 — ${relPath}\n` +
        violations.map((v, i) => `  ${i + 1}. ${v}`).join('\n') +
        `\n\n레이어 방향: shared(0) → entities(1) → features(2) → widgets(3) → _pages(4) → _app(5)\n` +
        `상세: .claude/rules/import-convention.md · fsd-*.md`
    );
  }

  allow();
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  try {
    main(JSON.parse(raw || '{}'));
  } catch (error) {
    process.stderr.write(`[fsd-layer-check] 훅 내부 오류로 검사를 건너뜁니다: ${error}\n`);
    process.exit(0);
  }
});
