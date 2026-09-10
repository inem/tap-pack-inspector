let playwright;
try { playwright=require('playwright'); }
catch (error) {
  if (!process.env.PLAYWRIGHT_PATH) throw new Error('Install playwright or set PLAYWRIGHT_PATH to its module directory', {cause:error});
  playwright=require(process.env.PLAYWRIGHT_PATH);
}
const {chromium}=playwright;
const fs=require('fs'),assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try {
    const page=await browser.newPage();
    await page.route('**/*',route=>route.fulfill({body:'<!doctype html><h1>Fixture</h1>',contentType:'text/html'}));
    await page.goto('https://fixture.example');
    const pack=process.argv[2] || 'artifacts/tap-inspector-0.3.4-built/pack';
    const code=fs.readFileSync(`${pack}/page.js`,'utf8');
    await page.addScriptTag({content:code});
    const lamp=page.getByRole('button',{name:'Open TAP page context'});
    assert.equal((await lamp.textContent()).trim(),'');
    const lampBox=await lamp.boundingBox();
    assert.equal(lampBox.x,0);
    assert.equal(lampBox.y,await page.evaluate(()=>innerHeight-20));
    assert.equal(lampBox.width,20);
    assert.equal(lampBox.height,20);
    await lamp.click();
    assert(await page.getByText('Unavailable',{exact:true}).isVisible());

    await page.evaluate(()=>{
      window.fixtureBridgeState='disabled';
      window.fixturePlanState='current';
      window.TapBridge={isReady:()=>false,status:()=>({state:window.fixtureBridgeState,plan_state:window.fixturePlanState,actions:[],packs:[{id:'fixture.reader',version:'2.0.0',features:[{id:'archive',label:'Session archive',value:'Versioned JSON'}]},{id:'fixture.ui',version:'1.2.3',features:[]},{id:'tap.inspector',version:'0.3.3',features:[]}]})};
      window.fixtureValue='2 controls';
      window.fixtureKey=Symbol();
      window[Symbol.for('tap.page.observations.v1')].set(window.fixtureKey,()=>[
        {id:'copy',label:'Quick copy',value:window.fixtureValue,kind:'feature'},
      ]);
    });
    await page.getByText('Active',{exact:true}).waitFor();
    assert(await page.getByText('fixture.ui',{exact:true}).isVisible());
    assert(await page.getByText('1.2.3',{exact:true}).isVisible());
    assert.equal(await page.getByRole('link',{name:'fixture.ui'}).getAttribute('href'),'https://github.com/inem/tap-pack-fixture-ui');
    assert.equal(await page.getByRole('link',{name:'tap.inspector'}).getAttribute('href'),'https://github.com/inem/tap-pack-inspector');
    assert(await page.getByText('fixture.reader · Session archive',{exact:true}).isVisible());
    assert(await page.getByText('Versioned JSON',{exact:true}).isVisible());
    assert(await page.getByText('Quick copy',{exact:true}).isVisible());
    assert(await page.getByText('2 controls',{exact:true}).isVisible());
    assert.equal(await page.getByText('Diagnostics',{exact:true}).count(),0);
    assert.equal(await page.getByText('Traffic capture runs independently from page features.',{exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:/Connect|Disconnect|Reconnect/}).count(),0);

    await page.evaluate(()=>window.fixtureValue='3 controls');
    await page.getByText('3 controls',{exact:true}).waitFor();
    await page.evaluate(()=>{window.fixtureBridgeState='ready';window.fixturePlanState='unavailable';});
    await page.getByText('Active',{exact:true}).waitFor();

    await page.evaluate(()=>window[Symbol.for('tap.page.observations.v1')].delete(window.fixtureKey));
    await page.getByText('Quick copy',{exact:true}).waitFor({state:'detached'});
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[aria-label="TAP page context"]').isVisible(),false);
    await page.addScriptTag({content:code});
    assert.equal(await page.locator('[data-tap-inspector]').count(),1);
    await page.evaluate(()=>window.__tapInspector.dispose());
    assert.equal(await page.locator('[data-tap-inspector]').count(),0);
    console.log('PASS: page state, pack versions, dynamic feature facts, Escape, reinjection, disposal');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
