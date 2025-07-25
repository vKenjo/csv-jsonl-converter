# CSV to JSON Lines Converter

Convert CSV files to JSON Lines format for GCP model training.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Upload CSV file (drag & drop or click)
2. Click "Convert to JSON Lines"
3. Preview converted data
4. Download JSON Lines file

## Features

- **Fast conversion** - Process large CSV files efficiently
- **Preview mode** - See first 5 converted lines before download
- **Drag & drop** - Easy file upload interface
- **Auto-filtering** - Removes empty rows automatically
- **Proper escaping** - Handles quotes and special characters

## CSV Requirements

- Headers in first row
- Comma-separated values
- UTF-8 encoding recommended

## Output Format

JSON Lines (.jsonl) - one JSON object per line:

```jsonl
{"name": "John", "age": "25", "city": "NYC"}
{"name": "Jane", "age": "30", "city": "LA"}
```

## Production Build

```bash
npm run build
npm start
```

## License

MIT
