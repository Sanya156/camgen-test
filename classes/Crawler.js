const puppeteer = require('puppeteer');
const fs = require('fs');

const cookiesPath = './cookies/cookies.json';

function sleep(time=2000) {
  return new Promise(r => setTimeout(r, time));
}

class Crawler {
  constructor(params) {
    this.url = params.url;
    this.download = {};
  }
  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        browserContext: "default",
      });
      this.pages = await this.browser.pages();
      if( this.pages && this.pages.length ) {
        this.page = this.pages[0];
      } else {
        this.page = await this.browser.newPage();
      }
      await this.page.setViewport({width:1920, height: 937});
      await this.page.setRequestInterception(true);
      this.page.on('request', this.setRequestInterception);
    } catch(e) {
      console.error(e);
    }
  }
  async goToPage() {
    try {
      let response = await this.page.goto(this.url, {waitUntil: 'networkidle2'});
      if(response.status() !== 200) {
        throw new Error(`Failed resource with status: ${response.status()}`);
      }
      console.log("Success open page");
    } catch(e) {
      console.error(e);
    }

  }
  async checkPage() {
    try {
      const is404Page = await this.page.$(".error-page.error-page-404").then (res =>!! res);
      if( is404Page ) {
        throw new Error("Page Not Found");
      }
      const agreeTermsBlock = await this.page.$(".welcome__content").then (res =>!! res);
      if( agreeTermsBlock ) {
        await this.agreeTerms();
        console.log("Agree Terms");
        await sleep(400);
      }
      const acceptCookiesBlock = await this.page.$(".welcome__content").then (res =>!! res);
      if( acceptCookiesBlock ) {
        await this.acceptCookies();
        console.log("Accept Cookies");
        await sleep(400);
      }
      const element = await this.page.$(".file-system-entry__title");
      this.download['fileName'] = await (await element.getProperty('textContent')).jsonValue();
      console.log(`Name of file: ${this.download.fileName}`);
    } catch(e) {
      console.error(e);
      this.close();
      this.init();
    }
  }
  async agreeTerms() {
    // .welcome__content
    let agreeTermsButton = await this.page.$("button.welcome__agree");
    let boundingBox = await agreeTermsButton.boundingBox();
    await this.page.mouse.click(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );
    // await agreeTermsButton.click();
  }
  async acceptCookies() {
    // .welcome__cookie-notice
    let acceptCookiesButton = await this.page.$("button.welcome__button--accept");
    let boundingBox = await acceptCookiesButton.boundingBox();
    await this.page.mouse.click(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );
  }
  async getDownloadLink() {
    let downloadFileButton = await this.page.$("button.transfer__button");
    let boundingBox = await downloadFileButton.boundingBox();
    await this.page.mouse.click(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );
    while(true) {
      if( this.download.url ) {
        console.log(`Direct link for downloading: ${this.download.url}`)
        return this.download;
      }
      await sleep(800);
    }
  }

  setRequestInterception = async (request) => {
    const url = request.url();
    if( /\/\/download.wetransfer.com/ig.test(url) ) {
      request.abort();
      this.download = Object.assign({}, this.download, {
        method: request.method(),
        url: request.url(),
        body: request.postData(),
        headers: request.headers()
      })
    } else {
      request.continue();
    }
  }
  async run() {
    try {
      await this.init();
      await this.goToPage();
      await this.checkPage();
      return await this.getDownloadLink();
    } catch(e) {
      console.error(e);
      this.close();
    }
  }
  async close() {
    if(this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = Crawler;