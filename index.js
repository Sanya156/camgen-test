const CrawlerClass = require('./classes/Crawler');
const DownloaderClass = require('./classes/Downloader');

const arg = process.argv.slice(2);

if(arg.length < 2) {
  console.error("No url or/and directory");
  process.exit(1);
}

(async () =>{
  try {
    let Crawler = new CrawlerClass({
      url : arg[0],
      downloadPath : arg[1],
    });
    let download = await Crawler.run();
    let Downloader = new DownloaderClass({
      ...download,
      downloadPath : arg[1]
    })
    let result = await Downloader.downloadFile();
    if( result && result.message ) {
      console.log( result.message );
    }
    process.exit(0);
  } catch(e) {
    console.error( e );
    process.exit(1);
  }
})()
