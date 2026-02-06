/**
 * 기본 instructions 파일 경로를 반환합니다.
 */
export declare function getDefaultInstructionsPath(): string;
/**
 * 마크다운 파일에서 instructions를 읽어옵니다.
 * @param filePath 파일 경로 (절대 경로 또는 상대 경로)
 * @returns 파일 내용 또는 null (파일이 없는 경우)
 */
export declare function readInstructionsFile(filePath: string): Promise<string | null>;
/**
 * 파일과 파라미터의 instructions를 병합합니다.
 * instructions_file이 지정되지 않으면 기본 instructions 파일(example-instructions.md)을 사용합니다.
 * @param instructionsFile 파일 경로 (선택, 미지정시 기본 파일 사용)
 * @param instructions 파라미터로 전달된 instructions (선택)
 * @returns 병합된 instructions 또는 undefined
 */
export declare function mergeInstructions(instructionsFile: string | undefined, instructions: string | undefined): Promise<string | undefined>;
//# sourceMappingURL=instructions.d.ts.map