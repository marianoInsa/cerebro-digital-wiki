import fs from "node:fs"
import path from "node:path"

/**
 * Create a directory link with a Windows fallback: symlink, then junction,
 * then a recursive copy. This mirrors quartz/cli/helpers.js for TypeScript code.
 */
export function symlinkOrCopySync(target: string, linkPath: string): void {
  try {
    fs.symlinkSync(target, linkPath, "dir")
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === "EEXIST") return
    if (code === "EPERM" && process.platform === "win32") {
      try {
        fs.symlinkSync(target, linkPath, "junction")
        return
      } catch {
        const resolvedTarget = path.resolve(path.dirname(linkPath), target)
        fs.cpSync(resolvedTarget, linkPath, { recursive: true })
        return
      }
    }
    throw error
  }
}
