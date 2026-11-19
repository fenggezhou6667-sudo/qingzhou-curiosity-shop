const {chromium}=require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const fs=require('node:fs');
const assert=require('node:assert/strict');
fs.mkdirSync('outputs',{recursive:true});

async function run(){
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const record={profiles:{},recovery:{},reducedMotion:{}};
  try{
    for(const [name,port] of [['baseline',8764],['planet',8765]]){
      const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
      const cdp=await p.context().newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
      await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:1250000,uploadThroughput:250000,connectionType:'cellular4g'});
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
      await p.addInitScript(()=>{
        const poll=()=>{if(window.__onetakeReady)window.__qaReadyTime=performance.now();else requestAnimationFrame(poll);};
        requestAnimationFrame(poll);
      });
      await p.goto('http://127.0.0.1:'+port,{waitUntil:'domcontentloaded'});
      await p.waitForFunction(()=>window.__qaReadyTime,null,{timeout:90000});
      await p.locator('#star-guide-btn').tap();
      await p.waitForTimeout(1900);
      record.profiles[name]=await p.evaluate(()=>new Promise(resolve=>{
        const ticks=[];
        function f(t){
          ticks.push(t); if(t-ticks[0]<8000)return requestAnimationFrame(f);
          const gaps=ticks.slice(1).map((v,i)=>v-ticks[i]).sort((a,b)=>a-b);
          resolve({readyMs:window.__qaReadyTime,p95Ms:gaps[Math.ceil(gaps.length*.95)-1],fps:1000*gaps.length/(t-ticks[0]),frames:gaps.length,ms:t-ticks[0],
            glbs:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).map(r=>({name:r.name.split('/').at(-1),bytes:r.encodedBodySize,ms:r.duration}))});
        }
        requestAnimationFrame(f);
      }));
      await p.close();
    }
    const p=await browser.newPage({reducedMotion:'reduce'});
    await p.route('**/rose-garden.glb',r=>r.fulfill({status:404,body:'QA missing asset'}));
    await p.goto('http://127.0.0.1:8765/unified.html');
    await p.locator('#btn-loader-retry').waitFor({state:'visible'});
    record.recovery.message=await p.locator('#loader-status').textContent();
    assert.ok(!await p.evaluate(()=>window.__onetakeReady));
    await p.unroute('**/rose-garden.glb');
    await p.locator('#btn-loader-retry').click();
    await p.waitForFunction(()=>window.__onetakeReady);
    record.recovery.retryReady=true;
    await p.locator('#star-guide-btn').click();
    await p.locator('#garden-land').click();
    await p.locator('#garden-rose').focus();
    await p.keyboard.press('Enter');
    assert.match(await p.locator('#cinema-toast').textContent(),/玫瑰/);
    await p.locator('#garden-study').focus();
    await p.keyboard.press('Enter');
    await p.waitForFunction(()=>window.__qzGetState().zone==='notes' && !window.__qzGetState().matchCutActive);
    record.reducedMotion.keyboardRoute=true;
    record.profiles.settings={downMbps:10,upMbps:2,latencyMs:80,cpuSlowdown:4,cache:'disabled',viewport:'390x844 CSS pixels',dpr:2};
    fs.writeFileSync('outputs/conditions.json',JSON.stringify(record,null,2));
    console.log(JSON.stringify(record));
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
