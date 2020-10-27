const { default: Axios } = require('axios');
const fs = require('fs');
const path = require('path');

class Downloader {
  constructor(params) {
    this.params = params;
    this.fullFilePath = path.resolve(this.params.downloadPath, this.params.fileName);
    fs.mkdirSync(this.params.downloadPath, {recursive: true});
    this.writer = fs.createWriteStream( this.fullFilePath );
  }

  async downloadFile(params=this.params) {
    return Axios({
      ...params, 
      responseType: "stream"
    }).then(response => {
      return new Promise((resolve, reject) => {
        response.data.pipe(this.writer);
        let error = null;
        this.writer.on('error', err => {
          error = err;
          writer.close();
          reject(err);
        });
        this.writer.on('close', () => {
          if (!error) {
            resolve({
              res : 1,
              message : `Success save file ${this.fullFilePath}`
            });
          }
        });
      })
    })
  }
}

module.exports = Downloader; 