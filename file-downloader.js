const https = require('https')
const fs = require('fs')

const downloads = [
  {
    filePath: './src/styles/graphiql.css',
    url: 'https://unpkg.com/graphiql@1.4.7/graphiql.min.css'
  },
  {
    filePath: './public/fonts/material-icons.ttf',
    url: 'https://fonts.gstatic.com/s/materialicons/v76/flUhRq6tzZclQEJ-Vdg-IuiaDsNZ.ttf'
  },
  {
    filePath: './public/fonts/material-icons-outlined.otf',
    url: 'https://fonts.gstatic.com/s/materialiconsoutlined/v44/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUcd.otf'
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

const httpRequestToFile = function (file, url, options) {
  return https.get(url, options, function (res) {
    if (res.statusCode == 302) {
      return httpRequestToFile(file, res.headers.location, options)
    }

    const file = fs.createWriteStream(file)

    res.pipe(file)
    file.on('finish', function () {
      file.close()
    })
  })
}

downloads.forEach((loc) =>
  httpRequestToFile(loc.filePath, loc.url, loc.options)
)
