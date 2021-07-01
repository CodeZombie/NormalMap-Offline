const puppeteer = require('puppeteer');
const fs = require('fs');

/* Converts the base64 blob data to a buffer that node's WriteFileSyc can use */
/* https://intoli.com/blog/saving-images/ */
const parseDataUrl = (dataUrl) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches.length !== 3) {
    throw new Error('Could not parse data URL.');
  }
  return { mime: matches[1], buffer: Buffer.from(matches[2], 'base64') };
};

(async () => {
    const browser = await puppeteer.launch({headless: false, devtools: true, args: ['--disable-web-security', '--disable-features=IsolateOrigins', ' --disable-site-isolation-trials']});
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/index.html`);

    //grab the upload image file handle
    const uploadImageHandle = await page.$('#select_file_height')
    //load up our image...
    await uploadImageHandle.uploadFile('stallman.jpg')

    //Just a test. This must be removed and replaced with a signal from the chrome instance signalling the canvas is ready.
    await page.waitForTimeout(1000);

    //Get the normal canvas pixel data from Chrome.
    let imageData = await page.evaluate(() => {
      return NMO_Main.getNormalBlob("image/png")
    })

    //convert the normal canvas pixel data to a buffer that Node can use.
    const { buffer } = parseDataUrl(imageData)

    //Save the normal canvas data
    fs.writeFileSync('stallman_normal.png', buffer, 'base64')

    console.log("DONE")
   await browser.close();
  })();