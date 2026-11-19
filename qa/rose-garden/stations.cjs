const {chromium}=require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const fs=require('node:fs');
const assert=require('node:assert/strict');
fs.mkdirSync('outputs',{recursive:true});
async function run(){
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    const record={errors:[]};
    page.on('pageerror',e=>record.errors.push(String(e)));
    await page.goto('http://127.0.0.1:8765/');
    await page.waitForFunction(()=>window.__onetakeReady);
    await page.locator('#btn-atlas-open').click();
    await page.locator('[data-atlas-t="0.32"]').click();
    await page.locator('#btn-open-poem-dossier').click();
    await page.locator('#dossier-modal').waitFor({state:'visible'});
    record.poem=await page.locator('#dossier-title').textContent();
    await page.locator('#dossier-close').click();
    await page.locator('.station-pill[data-station="labs"]').click();
    const lab=page.locator('[data-lab-tab]').last();
    await lab.click();
    record.lab=await lab.getAttribute('data-lab-tab');
    assert.equal(await page.evaluate(()=>window.__qzGetState().selectedLab),record.lab);
    await page.locator('.station-pill[data-station="traces"]').click();
    const city=page.locator('[data-city-pick]').last();
    await city.click();
    record.city=await city.getAttribute('data-city-pick');
    assert.equal(await page.evaluate(()=>window.__qzGetState().selectedCity),record.city);
    await page.locator('.station-pill[data-station="about"]').click();
    await page.locator('#wish-input-field').fill('星球原型本地回归');
    await page.locator('#river-wish-form button').click();
    await page.getByText('星球原型本地回归',{exact:false}).first().waitFor({state:'visible'});
    record.localRiverWish=true;
    await page.locator('#btn-roam-return').click();
    await page.locator('#star-guide-btn').waitFor({state:'visible'});
    record.returnZone=await page.evaluate(()=>window.__qzGetState().zone);
    assert.equal(record.returnZone,'works');
    assert.deepEqual(record.errors,[]);
    fs.writeFileSync('outputs/stations.json',JSON.stringify(record,null,2));
    console.log(JSON.stringify(record));
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
