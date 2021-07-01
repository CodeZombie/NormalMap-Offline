const puppeteer = require('puppeteer');
const fs = require('fs');

/* Converts the base64 blob data to a buffer that node's WriteFileSyc can use */
/* https://intoli.com/blog/saving-images/ */
parseDataUrl = (dataUrl) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches.length !== 3) {
    throw new Error('Could not parse data URL.');
  }
  return Buffer.from(matches[2], 'base64');
};

(async () => {
    console.log("Starting headless chrome...")
    const browser = await puppeteer.launch({headless: true, devtools: true, args: ['--disable-web-security', '--disable-features=IsolateOrigins', ' --disable-site-isolation-trials']});
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/index.html`);


    console.log("Loading image...")

    //grab the upload image file handle
    const uploadImageHandle = await page.$('#select_file_height')
    //load up our image...
    await uploadImageHandle.uploadFile('stallman.jpg')

    //Just a test. This must be removed and replaced with a signal from the chrome instance signalling the canvas is ready.
    await page.waitForTimeout(250);



    console.log("Generating Normal Map...")

    //Get the normal canvas pixel data from Chrome.
    let normalImageData = await page.evaluate(() => {
      return NMO_Main.getNormalBlob("image/png")
    })

    //convert the normal canvas pixel data to a buffer that Node can use.
    let normalBuffer = parseDataUrl(normalImageData)

    //Save the normal canvas data
    fs.writeFileSync('stallman_normal.png', normalBuffer, 'base64')



    console.log("Generating Specular Map...")

    //Get the specular canvas pixel data from Chrome.
    let specularImageData = await page.evaluate(() => {
      return NMO_Main.getSpecularBlob("image/png")
    })

    //convert the specular canvas pixel data to a buffer that Node can use.
    let specularBuffer = parseDataUrl(specularImageData)

    //Save the specular canvas data
    fs.writeFileSync('stallman_specular.png', specularBuffer, 'base64')


    console.log("Done.")
    await browser.close();
  })();