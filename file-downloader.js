const { https } = require('follow-redirects')
const fs = require('fs')

const downloads = [
  {
    filePath: './src/assets/external-files/react.js',
    url: 'https://unpkg.com/react/umd/react.production.min.js'
  },
  {
    filePath: './src/assets/external-files/react-dom.js',
    url: 'https://unpkg.com/react-dom/umd/react-dom.production.min.js'
  },
  {
    filePath: './src/assets/external-files/graphiql-js.js',
    url: 'https://unpkg.com/graphiql/graphiql.min.js'
  },
  {
    filePath: './src/styles/graphiql.css',
    url: 'https://unpkg.com/graphiql/graphiql.min.css'
  },
  {
    filePath: './public/fonts/material-icons.ttf',
    url:
      'https://fonts.gstatic.com/s/materialicons/v76/flUhRq6tzZclQEJ-Vdg-IuiaDsNZ.ttf'
  },
  {
    filePath: './public/fonts/material-icons-outlined.otf',
    url:
      'https://fonts.gstatic.com/s/materialiconsoutlined/v44/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUcd.otf'
  },
  {
    filePath: './public/fonts/roboto-100.ttf',
    url: 'https://fonts.gstatic.com/s/roboto/v20/KFOkCnqEu92Fr1MmgWxP.ttf'
  },
  {
    filePath: './public/fonts/roboto-300.ttf',
    url: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmSU5vAw.ttf'
  },
  {
    filePath: './public/fonts/roboto-400.ttf',
    url: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Me5Q.ttf'
  },
  {
    filePath: './public/fonts/roboto-500.ttf',
    url: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmEU9vAw.ttf'
  },
  {
    filePath: './public/fonts/roboto-700.ttf',
    url: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlvAw.ttf'
  }
]

downloads.forEach(loc => {
  const file = fs.createWriteStream(loc.filePath)
  https.get(loc.url, function(res) {
    res.pipe(file)
    file.on('finish', function() {
      file.close()
    })
  })
})
