import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve } from "path";

/**
 * 마크다운 파일에서 instructions를 읽어옵니다.
 * @param filePath 파일 경로 (절대 경로 또는 상대 경로)
 * @returns 파일 내용 또는 null (파일이 없는 경우)
 */
export async function readInstructionsFile(filePath: string): Promise<string | null> {
  try {
    const absolutePath = resolve(filePath);

    if (!existsSync(absolutePath)) {
      return null;
    }

    const content = await readFile(absolutePath, "utf-8");
    return content.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Instructions 파일 읽기 실패: ${error.message}`);
    }
    throw new Error("Instructions 파일 읽기 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 파일과 파라미터의 instructions를 병합합니다.
 * @param instructionsFile 파일 경로 (선택)
 * @param instructions 파라미터로 전달된 instructions (선택)
 * @returns 병합된 instructions 또는 undefined
 */
export async function mergeInstructions(
  instructionsFile: string | undefined,
  instructions: string | undefined
): Promise<string | undefined> {
  let fileContent: string | null = null;

  // 파일에서 읽기
  if (instructionsFile) {
    fileContent = await readInstructionsFile(instructionsFile);
    if (fileContent === null) {
      throw new Error(`Instructions 파일을 찾을 수 없습니다: ${instructionsFile}`);
    }
  }

  // 병합
  if (fileContent && instructions) {
    // 파일 내용 + 파라미터 내용 병합
    return `${fileContent}\n\n---\n\n## 추가 지침\n${instructions}`;
  } else if (fileContent) {
    return fileContent;
  } else if (instructions) {
    return instructions;
  }

  return undefined;
}
