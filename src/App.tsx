
import { useState, useEffect } from 'react'
import './App.css'

interface Schema {
  name: string
  displayName: string
}

interface ExtractionResult {
  result: any
  jsonSchema: any
}

function App() {
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [schemaCollapsed, setSchemaCollapsed] = useState(true)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    fetchSchemas()
  }, [])

  const fetchSchemas = async () => {
    try {
      const response = await fetch('/api/schemas')
      const data = await response.json()
      const schemaList = data.result.map((name: string) => ({
        name: name,
        displayName: name
      }))
      setSchemas(schemaList)
    } catch (error) {
      console.error('Failed to fetch schemas:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedSchema) return

    setLoading(true)
    const formData = new FormData()
    formData.append('upload', file)
    formData.append('schema', selectedSchema)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Extraction failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const syntaxHighlight = (json: any) => {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, null, 2)
    }
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match: string) => {
        let cls = 'text-slate-800'
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-700 font-medium'
          } else {
            cls = 'text-emerald-700'
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-700'
        } else if (/null/.test(match)) {
          cls = 'text-red-600'
        } else if (/\d/.test(match)) {
          cls = 'text-orange-600'
        }
        return `<span class="${cls}">${match}</span>`
      }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Peridot, sans-serif' }}>
            AI Avenue - <span style={{ color: '#FF6B3D' }}>🎸</span> Band Poster Extractor
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a band poster image and use AI to extract structured information. 
            This educational tool demonstrates how AI can parse visual content into JSON data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">1. Choose Extraction Schema</h2>
            <select
              value={selectedSchema}
              onChange={(e) => setSelectedSchema(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              required
            >
              <option value="">Select a schema...</option>
              {schemas.map((schema) => (
                <option key={schema.name} value={schema.name}>
                  {schema.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">2. Upload Band Poster</h2>
            <div
              className={`border-3 border-dashed rounded-lg p-12 text-center transition-all ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Band poster preview"
                    className="max-w-md mx-auto rounded-lg shadow-md"
                  />
                  <div className="text-green-600 text-xl font-medium">
                    ✓ {file.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700 underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl text-gray-400">📸</div>
                  <div className="text-xl text-gray-600">
                    Drag and drop your band poster here
                  </div>
                  <div className="text-gray-500">or</div>
                  <label className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      name="upload"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={!file || !selectedSchema || loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-4 rounded-lg text-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              {loading ? 'Extracting...' : 'Extract Information'}
            </button>
          </div>
        </form>

        {result && (
          <div className="max-w-4xl mx-auto mt-12 space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Extraction Results</h2>
              <div className="bg-slate-100 border rounded-lg p-6 overflow-auto">
                <pre
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: syntaxHighlight(result.result)
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">JSON Schema</h2>
                <button
                  onClick={() => setSchemaCollapsed(!schemaCollapsed)}
                  className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  {schemaCollapsed ? 'Show Schema' : 'Hide Schema'}
                </button>
              </div>
              
              {!schemaCollapsed && (
                <div className="bg-slate-100 border rounded-lg p-6 overflow-auto">
                  <pre
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: syntaxHighlight(result.jsonSchema)
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <footer className="sticky bottom-0 bg-white border-t border-gray-200 py-4 mt-12">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Built with <span style={{ color: '#FF6B3D' }}>🧡</span> on{' '}
            <a href="https://developers.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              Cloudflare Workers
            </a>
            {' '}&{' '}
            <a href="https://developers.cloudflare.com/workers-ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              Workers AI
            </a>
            {' '}for{' '}
            <a href="https://aiavenue.show" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              AI Avenue
            </a>
          </p>
          <p className="text-sm text-gray-600">
            <a href="https://github.com/craigsdennis" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              👀 the code
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
