export interface FileValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export class FileValidator {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]

  static validateImage(file: File): FileValidationResult {
    const warnings: string[] = []

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, WebP, HEIC, or HEIF image.'
      }
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${this.formatFileSize(this.MAX_FILE_SIZE)}.`
      }
    }

    // Add warnings for large files
    if (file.size > 5 * 1024 * 1024) { // 5MB
      warnings.push('Large file detected. Image will be compressed for faster upload.')
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}