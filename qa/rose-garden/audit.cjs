const {chromium} = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [url, tag, form] = process.argv.slice(2);
const out = path.resolve('outputs');
fs.mkdirSync(out,{recursive:true});
const mobile = form === 'mobile';
async function run() {
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,
    args:['--enable-webgl','--ignore-gpu-blocklist','--disable-background-timer-throttling']});
  try {
    const page = await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900}, deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
    const record={tag,form,browser:browser.version(),console:[],errors:[],requests:[],scenes:[]};
    // Collect a separate short GPU timer sample around the site's real animation
    // callback. The normal frame-pacing run below does not use timer queries.
    await page.addInitScript(()=>{
      const raf=requestAnimationFrame.bind(window);
      const results=[];
      let remaining=0,gl,ext;
      window.beginGardenGpuSample=()=>{
        gl=document.querySelector('#onetake-canvas').getContext('webgl2');
        ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
        results.length=0;
        remaining=ext?30:0;
        return Boolean(ext);
      };
      window.gardenGpuSample=results;
      window.requestAnimationFrame=cb=>{
        if(cb.name!=='animate')return raf(cb);
        return raf(now=>{
          if(!remaining)return cb(now);
          remaining--;
          const q=gl.createQuery();
          gl.beginQuery(ext.TIME_ELAPSED_EXT,q);
          try{cb(now);}finally{gl.endQuery(ext.TIME_ELAPSED_EXT);}
          function read(){
            if(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE))return raf(read);
            const ok=!gl.getParameter(ext.GPU_DISJOINT_EXT);
            results.push(ok?gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6:null);
            gl.deleteQuery(q);
          }
          raf(read);
        });
      };
    });
    page.on('console',m=>{if(['warning','error'].includes(m.type()))record.console.push([m.type(),m.text()]);});
    page.on('pageerror',e=>record.errors.push(String(e)));
    page.on('requestfailed',r=>record.requests.push([r.url(),r.failure()]));
    page.on('response',r=>{if(r.status()>=400)record.requests.push([r.url(),r.status()]);});
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__onetakeReady || document.querySelector('#cinema-loader.is-error'),null,{timeout:120000});
    if(!await page.evaluate(()=>window.__onetakeReady))throw Error(await page.locator('#loader-status').textContent());
    record.gpu=await page.evaluate(()=>{const c=document.querySelector('canvas').getContext('webgl2');const e=c.getExtension('WEBGL_debug_renderer_info');return e?c.getParameter(e.UNMASKED_RENDERER_WEBGL):'unavailable';});
    record.readyMs=await page.evaluate(()=>performance.now());
    await page.waitForTimeout(1200);
    record.home=await page.evaluate(()=>window.__qzGetState());
    async function sample(){
      return page.evaluate(()=>new Promise(resolve=>{const t=[];function f(now){t.push(now);if(now-t[0]<5000||t.length<12)return requestAnimationFrame(f);const gaps=t.slice(1).map((v,i)=>v-t[i]).sort((a,b)=>a-b);resolve({frames:gaps.length,ms:t.at(-1)-t[0],fps:1000*gaps.length/(t.at(-1)-t[0]),p95Ms:gaps[Math.ceil(.95*gaps.length)-1]});}requestAnimationFrame(f);}));
    }
    const shot=async label=>page.screenshot({path:path.join(out,tag+'-'+form+'-'+label+'.jpg'),type:'jpeg',quality:89,timeout:60000});
    const hit=async locator=>mobile?locator.tap():locator.click();
    const pixelHit=async(x,y)=>mobile?page.touchscreen.tap(x,y):page.mouse.click(x,y);
    if(tag==='final'){
      await shot('starfield');
      await page.evaluate(()=>window.__qzFocusTarget('frame-0'));
      await pixelHit(mobile?195:720,mobile?422:450);
      await page.locator('#darkroom-modal').waitFor({state:'visible',timeout:5000});
      await page.locator('#dr-main-img').evaluate(im=>im.decode());
      await page.waitForTimeout(650);
      await shot('darkroom');
      await hit(page.locator('#dr-garden-btn'));
      await page.locator('#garden-land').waitFor({state:'visible'});
    }else if(tag==='baseline')await page.evaluate(()=>window.__qzFocusTarget('b612'));
    else {
      await page.locator('#star-guide-btn').click();
      await page.waitForTimeout(1900);
    }
    record.landed=await page.evaluate(()=>window.__qzGetState());
    record.landingPerf=await sample();
    if(await page.evaluate(()=>window.beginGardenGpuSample())){
      await page.waitForFunction(()=>window.gardenGpuSample.length>=30);
      record.gpuFrameMs=await page.evaluate(()=>window.gardenGpuSample.slice().filter(x=>x!==null).sort((a,b)=>a-b));
    }
    await shot('planet');
    if(tag==='final'){
      await hit(page.locator('#garden-land'));
      await page.locator('#garden-study').waitFor({state:'visible'});
      record.path=await page.evaluate(()=>window.__qzGetState());
      assert.ok(record.path.cameraPos[2]<34);
      record.pathPerf=await sample();
      await shot('path');
      const project=async xyz=>page.evaluate(async xyz=>{
        const T=await import('./vendor/three/three.module.js');
        const aspect=innerWidth/innerHeight, pose=window.__qzGetState(), c=new T.PerspectiveCamera(aspect<.85?58:50,aspect,.1,480);
        c.position.fromArray(pose.cameraPos);c.rotation.set(pose.pitch,pose.yaw,0,'YXZ');c.updateMatrixWorld();
        const p=new T.Vector3(...xyz).project(c);
        return [Math.round((p.x+1)*innerWidth/2),Math.round((1-p.y)*innerHeight/2)];
      },xyz);
      const rosePixel=await project([.115,30.13,29.65]);
      await pixelHit(...rosePixel);
      await page.waitForFunction(()=>!document.querySelector('#cinema-toast').hidden && document.querySelector('#cinema-toast').textContent.includes('玫瑰'),null,{timeout:3000});
      record.rose={pixel:rosePixel,text:await page.locator('#cinema-toast').textContent()};
      const cottagePixel=await project([-1.07,30.84,29.60]);
      await pixelHit(...cottagePixel);
      await page.waitForFunction(()=>window.__qzGetState().zone==='notes' && !window.__qzGetState().matchCutActive);
      record.study=await page.evaluate(()=>window.__qzGetState());
      await shot('study');
      await hit(page.locator('#btn-roam-return'));
      await hit(page.locator('#star-guide-btn'));
      await hit(page.locator('#garden-land'));
      await hit(page.locator('#garden-orbit'));
      await page.locator('#garden-land').waitFor({state:'visible'});
      record.returnVerified=true;
    }
    for(const [n,zone] of [[.32,'notes'],[.50,'labs'],[.75,'traces'],[.96,'about']]){
      const st=await page.evaluate(t=>window.__qzSetT(t),n);
      assert.equal(st.zone,zone);
      assert.equal(st.worldVisible,true);
      record.scenes.push([n,st.zone,st.worldVisible,st.cameraPos]);
    }
    assert.deepEqual(record.errors,[]);
    assert.deepEqual(record.requests,[]);
    assert.deepEqual(record.console.filter(([level])=>level==='error'),[]);
    fs.writeFileSync(path.join(out,tag+'-'+form+'.json'),JSON.stringify(record,null,2));
    console.log(JSON.stringify({gpu:record.gpu,perf:record.landingPerf,issues:[record.console,record.errors,record.requests],scenes:record.scenes}));
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
