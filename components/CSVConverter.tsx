'use client'

import { useState, useCallback, DragEvent, ChangeEvent } from 'react'
import { Upload, Download, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface ConversionResult {
  lines: string
  count: number
}

interface StatusMessage {
  message: string
  type: 'success' | 'error' | 'info'
}

export default function CSVConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)

  const showStatus = useCallback((message: string, type: StatusMessage['type']) => {
    setStatus({ message, type })
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type === 'text/csv') {
      setSelectedFile(file)
      setStatus(null)
      setPreview('')
      setDownloadUrl('')
    } else {
      showStatus('Please select a valid CSV file.', 'error')
    }
  }, [showStatus])

  const handleFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const readFileAsText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file, 'utf-8')
    })
  }, [])

  const parseCSVLine = useCallback((line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i += 2
        } else {
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current.trim())
    return result
  }, [])

  const parseCSVToJSONLines = useCallback((csvContent: string): ConversionResult => {
    const lines = csvContent.split('\n')
    let jsonLines = ''
    let validRowCount = 0

    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    const headerLine = lines[0].trim()
    const headers = parseCSVLine(headerLine)

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = parseCSVLine(line)
        const jsonObj: Record<string, string> = {}

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j]
          const value = j < values.length ? values[j] : ''
          jsonObj[header] = value
        }

        const hasContent = Object.values(jsonObj).some((val: string) => val.trim() !== '')
        if (hasContent) {
          jsonLines += JSON.stringify(jsonObj) + '\n'
          validRowCount++
        }
      } catch (error) {
        console.warn(`Skipped malformed line ${i + 1}:`, line)
      }
    }

    return { lines: jsonLines, count: validRowCount }
  }, [parseCSVLine])

  const convertFile = useCallback(async () => {
    if (!selectedFile) {
      showStatus('Please select a CSV file first.', 'error')
      return
    }

    try {
      setIsConverting(true)
      showStatus('Reading and converting file...', 'info')

      const fileContent = await readFileAsText(selectedFile)
      const result = parseCSVToJSONLines(fileContent)

      if (result.lines === '') {
        showStatus('No valid data found in the CSV file.', 'error')
        return
      }

      showStatus(
        `Conversion completed! Total rows converted: ${result.count} | File size: ${(result.lines.length / 1024 / 1024).toFixed(2)} MB`,
        'success'
      )

      const previewLines = result.lines.split('\n').slice(0, 5).join('\n')
      setPreview(previewLines)

      const blob = new Blob([result.lines], { type: 'application/jsonl' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

    } catch (error) {
      showStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setIsConverting(false)
    }
  }, [selectedFile, showStatus, readFileAsText, parseCSVToJSONLines])

  const StatusIcon = ({ type }: { type: StatusMessage['type'] }) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />
      case 'error': return <AlertCircle className="w-5 h-5" />
      case 'info': return <Info className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CSV to JSON Lines Converter
          </h1>
          <p className="text-gray-600 text-lg">
            Transform your CSV files into JSON Lines format with ease
          </p>
        </div>

        <div className="card max-w-2xl mx-auto">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="w-8 h-8 text-gray-600" />
              </div>
              
              <div>
                <label htmlFor="csvFile" className="cursor-pointer">
                  <span className="text-lg font-medium text-blue-600 hover:text-blue-700">
                    Click to select your CSV file
                  </span>
                  <p className="text-gray-500 mt-1">or drag and drop it here</p>
                </label>
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Selected File:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Name:</span> {selectedFile.name}</p>
                <p><span className="font-medium">Size:</span> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><span className="font-medium">Type:</span> {selectedFile.type || 'text/csv'}</p>
              </div>
            </div>
          )}

          {/* Convert Button */}
          {selectedFile && (
            <div className="mt-6 text-center">
              <button
                onClick={convertFile}
                disabled={isConverting}
                className="btn-primary inline-flex items-center space-x-2"
              >
                {isConverting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Convert to JSON Lines</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Status */}
          {status && (
            <div className={`mt-6 flex items-start space-x-3 status-${status.type}`}>
              <StatusIcon type={status.type} />
              <div className="flex-1">
                <div dangerouslySetInnerHTML={{ __html: status.message }} />
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Preview (first 5 lines):</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-64 overflow-y-auto">
                {preview}
              </pre>
            </div>
          )}

          {/* Download Button */}
          {downloadUrl && selectedFile && (
            <div className="mt-6 text-center">
              <a
                href={downloadUrl}
                download={selectedFile.name.replace('.csv', '.jsonl')}
                className="btn-success inline-flex items-center space-x-2 no-underline"
              >
                <Download className="w-4 h-4" />
                <span>Download {selectedFile.name.replace('.csv', '.jsonl')}</span>
              </a>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy Upload</h3>
            <p className="text-gray-600 text-sm">Drag & drop or click to upload your CSV files</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast Conversion</h3>
            <p className="text-gray-600 text-sm">Convert CSV to JSON Lines format in seconds</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Download</h3>
            <p className="text-gray-600 text-sm">Download your converted files immediately</p>
          </div>
        </div>
      </div>
    </div>
  )
}
