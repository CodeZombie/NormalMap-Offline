const puppeteer = require('puppeteer');
const fs = require('fs');
const mkdirp = require('mkdirp')
var getDirName = require('path').dirname;


/* Converts the base64 blob data to a buffer that node's WriteFileSyc can use */
/* https://intoli.com/blog/saving-images/ */
parseDataUrl = (dataUrl) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches.length !== 3) {
    throw new Error('Could not parse data URL.');
  }
  return Buffer.from(matches[2], 'base64');
};


//Loads an image into the NMO tool and waits for all the canvases to update and draw before returning.
async function loadImage(page, filename) {
  //Grab a reference to the file loader
  const uploadImageHandle = await page.$('#select_file_height')

  //set NMO_FileDrop.ready to false to so that it waits before continuing this script
  await page.evaluate( () => {
    NMO_FileDrop.image_loaded = false;
  })

  //load the file.
  await uploadImageHandle.uploadFile(filename)

  //wait until the image is loaded...
  let image_loaded = false
  while (!image_loaded){
    image_loaded = await page.evaluate( () => {
      return NMO_FileDrop.image_loaded
    })
  }
  return
}

/*Captures and converts the canvas data corresponding to a particular type of map generated by the tool.
Saves this data with the given parameters.
Params:
  page: the Puppeteer page holding the NMO webpage.
  map_type: "normal" or "specular"
  filetype: "png" or "jpg"
  filename: the name of the file without extension. The extension will be automatically appended based on your filetype choice.
*/
async function saveMap(page, map_type, file_type, filename) {
    let mime_type = ""
    let extension = ""
    if(file_type.toLowerCase() == "png"){
      mime_type = "image/png"
      extension = ".png"
    }else if(file_type.toLowerCase() == "jpg"){
      mime_type = "image/jpg"
      extension = ".jpg"
    }else{
      console.log("Unknown file type: " + file_type)
      return
    }

    //Get the canvas pixel data from Chrome.
    let imageData
    if(map_type == "normal"){
      imageData = await page.evaluate((mtype) => {
        return NMO_Main.getNormalBlob(mtype)
      }, mime_type)
    }else if(map_type == "specular"){
      imageData = await page.evaluate((mtype) => {
        return NMO_Main.getSpecularBlob(mtype)
      }, mime_type)
    }else{
      console.log("UNKNOWN MAP TYPE: " + map_type)
      return;
    }
    
    //convert the normal canvas pixel data to a buffer that Node can use.
    let buffer = parseDataUrl(imageData)
    //Save the normal canvas data
    mkdirp.sync(getDirName(filename))
    fs.writeFileSync(filename + extension, buffer, 'base64')
}

(async () => {

    const browser = await puppeteer.launch({headless: true, devtools: false, args: ['--disable-web-security', '--disable-features=IsolateOrigins', ' --disable-site-isolation-trials']});
    
    const page = await browser.newPage();

    await page.goto(`file://${__dirname}/index.html`);
    for(let i = 500; i < 551; i++) {
      console.log(i)
      let fname = "Head_GeoShape.diffuse." + i.toString()
      await loadImage(page, "diffuse_maps/" + fname + ".jpeg")

      await saveMap(page, "normal", "jpg", "normals/" + fname + ".normal")

      await saveMap(page, "specular", "jpg", "speculars/" + fname + ".specular")
    }
    

    await browser.close();
  })();