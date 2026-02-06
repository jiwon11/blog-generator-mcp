import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 패키지 루트: src/services/ 또는 dist/services/ 에서 2단계 상위
const PACKAGE_ROOT = resolve(__dirname, "../..");
const DEFAULT_INSTRUCTIONS_PATH = join(PACKAGE_ROOT, "example-instructions.md");
/**
 * 기본 instructions 파일 경로를 반환합니다.
 */
export function getDefaultInstructionsPath() {
    return DEFAULT_INSTRUCTIONS_PATH;
}
/**
 * 마크다운 파일에서 instructions를 읽어옵니다.
 * @param filePath 파일 경로 (절대 경로 또는 상대 경로)
 * @returns 파일 내용 또는 null (파일이 없는 경우)
 */
export async function readInstructionsFile(filePath) {
    try {
        const absolutePath = resolve(filePath);
        if (!existsSync(absolutePath)) {
            return null;
        }
        const content = await readFile(absolutePath, "utf-8");
        return content.trim();
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Instructions 파일 읽기 실패: ${error.message}`);
        }
        throw new Error("Instructions 파일 읽기 중 알 수 없는 오류가 발생했습니다.");
    }
}
/**
 * 파일과 파라미터의 instructions를 병합합니다.
 * instructions_file이 지정되지 않으면 기본 instructions 파일(example-instructions.md)을 사용합니다.
 * @param instructionsFile 파일 경로 (선택, 미지정시 기본 파일 사용)
 * @param instructions 파라미터로 전달된 instructions (선택)
 * @returns 병합된 instructions 또는 undefined
 */
export async function mergeInstructions(instructionsFile, instructions) {
    let fileContent = null;
    // 파일에서 읽기 (지정된 파일이 없으면 기본 파일 사용)
    const targetFile = instructionsFile || DEFAULT_INSTRUCTIONS_PATH;
    fileContent = await readInstructionsFile(targetFile);
    if (instructionsFile && fileContent === null) {
        // 사용자가 명시적으로 지정한 파일이 없는 경우에만 에러
        throw new Error(`Instructions 파일을 찾을 수 없습니다: ${instructionsFile}`);
    }
    // 병합
    if (fileContent && instructions) {
        // 파일 내용 + 파라미터 내용 병합
        return `${fileContent}\n\n---\n\n## 추가 지침\n${instructions}`;
    }
    else if (fileContent) {
        return fileContent;
    }
    else if (instructions) {
        return instructions;
    }
    return undefined;
}
//# sourceMappingURL=instructions.js.map