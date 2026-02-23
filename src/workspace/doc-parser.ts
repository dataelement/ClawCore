import fs from "node:fs/promises";
import path from "node:path";

/**
 * Document parser: extracts text content from various file formats.
 * Supports: .md, .txt, .json, .csv, .pdf, .docx, .xlsx, .pptx
 */

const TEXT_EXTENSIONS = new Set([
  ".md", ".txt", ".json", ".csv", ".log", ".yaml", ".yml",
  ".xml", ".html", ".htm", ".css", ".js", ".ts", ".py",
  ".sh", ".bash", ".zsh", ".toml", ".ini", ".cfg", ".conf",
]);

export async function parseDocument(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (TEXT_EXTENSIONS.has(ext)) {
    return fs.readFile(filePath, "utf-8");
  }

  switch (ext) {
    case ".pdf":
      return parsePdf(filePath);
    case ".docx":
      return parseDocx(filePath);
    case ".xlsx":
    case ".xls":
      return parseExcel(filePath);
    case ".pptx":
      return parsePptx(filePath);
    default:
      return `[Binary file: ${path.basename(filePath)}, cannot read content directly]`;
  }
}

async function parsePdf(filePath: string): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    return `[Error reading PDF: ${err instanceof Error ? err.message : String(err)}]`;
  }
}

async function parseDocx(filePath: string): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (err) {
    return `[Error reading DOCX: ${err instanceof Error ? err.message : String(err)}]`;
  }
}

async function parseExcel(filePath: string): Promise<string> {
  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.readFile(filePath);
    const lines: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      lines.push(`## Sheet: ${sheetName}`);
      const csv = XLSX.utils.sheet_to_csv(sheet);
      lines.push(csv);
      lines.push("");
    }

    return lines.join("\n");
  } catch (err) {
    return `[Error reading Excel: ${err instanceof Error ? err.message : String(err)}]`;
  }
}

async function parsePptx(filePath: string): Promise<string> {
  // PPTX is a zip of XML files. We'll do a lightweight extraction.
  try {
    const XLSX = await import("xlsx");
    // xlsx can sometimes read pptx tables, but for text we'll try a simpler approach
    const buffer = await fs.readFile(filePath);
    // Use a basic XML extraction from the zip
    const JSZip = (await import("xlsx")).default;
    // Fallback: just note the file exists
    return `[PowerPoint file: ${path.basename(filePath)}. Use copy_to_workbench to work with this file.]`;
  } catch (err) {
    return `[PowerPoint file: ${path.basename(filePath)}. Use copy_to_workbench to work with this file.]`;
  }
}

export function isReadableFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext) || [".pdf", ".docx", ".xlsx", ".xls", ".pptx"].includes(ext);
}

export function getFileTypeDescription(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const descriptions: Record<string, string> = {
    ".pdf": "PDF document",
    ".docx": "Word document",
    ".xlsx": "Excel spreadsheet",
    ".xls": "Excel spreadsheet (legacy)",
    ".pptx": "PowerPoint presentation",
    ".md": "Markdown",
    ".txt": "Text file",
    ".json": "JSON data",
    ".csv": "CSV data",
  };
  return descriptions[ext] ?? `${ext} file`;
}
