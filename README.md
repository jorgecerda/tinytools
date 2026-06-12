# tiinytools

![tiinytools](assets/tiinytools.png)

https://tiinytools.netlify.app

a collection of simple client-side web tools. calculate percentages, count words, split/merge pdfs, convert json, build utm tags, and check urls directly in your browser with no server uploads.

## features

- **100% client-side processing**: your data never leaves your browser, ensuring absolute privacy and security.
- **percentage calculator**: instantly calculate percentages, differences, increases, and fractions as you type.
- **pdf split & join**: extract specific pages or merge multiple pdf documents locally using `pdf-lib`.
- **pdf compress & convert**: reduce pdf file size locally in your browser, or convert pdfs to word, powerpoint, excel and png images via cloudconvert api.
- **character counter & text analyzer**: analyze text length, word count, sentence count, and readability in real-time.
- **url http status checker**: check http status codes, redirect destinations, and response headers for multiple urls in bulk.
- **url redirect checker**: track the complete path a url takes, identifying redirect chains, intermediate urls, status codes, and headers.
- **json to csv converter**: convert json objects or arrays recursively (with nested attribute auto-flattening) to csv. features a 10-row preview and excelsior-compatible downloads.
- **utm build & verify**: build campaigns with structured url inputs or inspect existing urls to analyze parameters. categorizes traffic directly under google analytics 4 (ga4) default channel grouping rules.
- **dynamic dashboard tags**: categories on the dashboard are counted and sorted dynamically by the number of active tools.
- **quick url share buttons**: copy and share direct links to the site or specific tools with one click next to the titles.

## design system

built with a focus on modern web aesthetics, featuring:
- sleek glassmorphism ui cards
- fully responsive grid layout
- beautiful dark mode by default (with light mode toggle)
- vanilla html, css, and es6 javascript (no heavy frameworks required)

## dependencies

this project uses the following dependencies:
- **pdf-lib**: dynamically loaded via cdn for client-side pdf modification (splitting, joining, and reconstruction)
- **pdf.js**: dynamically loaded via cdn for client-side pdf rendering and compression
- **cloudconvert api**: integration used by serverless functions to convert pdf files to docx, pptx, xlsx, and png
- **netlify functions**: serverless backend endpoints used for checking url statuses and interacting with the cloudconvert api

## getting started

because the tools are entirely static and client-side, you can run them locally with zero configuration.

to run locally for development:
```bash
npx netlify dev
```
then visit `http://localhost:8888` in your browser.

### qa & testing stack

we use vitest for unit testing and eslint + prettier for linting and formatting.

to run tests locally:
```bash
npm run test
```

to run linting checks:
```bash
npm run lint
```

## structure tree

```
tiinytools/
├── index.html            # main html entry point
├── netlify.toml          # netlify configuration
├── eslint.config.js      # eslint rules configuration
├── .prettierrc           # prettier config rules
├── package.json          # dependencies and npm scripts
├── assets/               # static images and icons
│   ├── logo.png          # application logo
│   └── tiinytools.png    # project branding image
├── css/                  # styling files
│   ├── main.css          # global styling
│   └── tools/            # tool-specific stylesheets
│       ├── percentage.css       # percentage calculator styles
│       ├── pdf.css              # pdf split & join styles
│       ├── text.css             # character counter styles
│       ├── pdftools.css         # pdf compress & convert styles
│       ├── bulk-status.css      # url http status checker styles
│       ├── redirect-checker.css # url redirect checker styles
│       ├── json-to-csv.css      # json to csv converter styles
│       └── utm-builder.css      # utm builder and verifier styles
├── js/                   # javascript files
│   ├── app.js            # main routing and search logic
│   ├── shared/
│   │   └── utils.js      # shared helper functions
│   └── tools/            # tool-specific script files
│       ├── percentage.js        # percentage calculator logic
│       ├── pdf.js               # pdf split & join logic
│       ├── text.js              # character counter logic
│       ├── pdftools.js          # pdf compress & convert logic
│       ├── bulk-status.js       # url http status checker logic
│       ├── redirect-checker.js  # url redirect checker logic
│       ├── json-to-csv.js       # json to csv converter logic
│       ├── utm-builder.js       # utm campaign builder logic
│       └── __tests__/           # vitest unit tests
│           ├── percentage.test.js
│           ├── text.test.js
│           ├── bulk-status.test.js
│           ├── redirect-checker.test.js
│           ├── json-to-csv.test.js
│           └── utm-builder.test.js
└── netlify/              # serverless backend config
    └── functions/        # serverless endpoints
        ├── cc-start.js   # start cloudconvert job
        ├── cc-status.js  # check cloudconvert status
        └── check-url.js  # proxy to fetch headers and redirects
```

## deployment

this project is built to be hosted on any static hosting provider. it is currently configured for continuous deployment via netlify. simply push to the main branch, and the live site updates automatically.
