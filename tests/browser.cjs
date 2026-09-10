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
    const pack=process.argv[2] || 'artifacts/tap-inspector-0.3.9-built/pack';
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
      window.fixturePending=0;
      window.fixtureActivity={pending:0,outbound:0,inbound:0,sequence:0};
      window.fixtureMode='installed';
      window.fixtureOperations=new Map();
      window.fixtureRequests=[];
      window.TapBridge={isReady:()=>false,request:async(handler,args)=>{window.fixtureRequests.push({handler,args});return{path:'/fixture/'+args.path};},expose:(name,handler)=>{window.fixtureOperations.set(name,handler);return()=>window.fixtureOperations.delete(name);},status:()=>({state:window.fixtureBridgeState,plan_state:window.fixturePlanState,mode:window.fixtureMode,pending:window.fixturePending,activity:window.fixtureActivity,actions:[],packs:[{id:'fixture.reader',version:'2.0.0',features:[{id:'archive',label:'Session archive',value:'Versioned JSON',folder:'data/readers/fixture.reader'}]},{id:'fixture.ui',version:'1.2.3',features:[]},{id:'tap.inspector',version:'0.3.9',features:[{id:'page-inspection',label:'Page inspection',value:'Local WebSocket operations'}]}]})};
      window.fixtureValue='2 controls';
      window.fixtureKey=Symbol();
      window[Symbol.for('tap.page.observations.v1')].set(window.fixtureKey,()=>[
        {id:'copy',label:'Quick copy',value:window.fixtureValue,kind:'feature'},
      ]);
    });
    await page.addScriptTag({content:code});
    await page.getByRole('button',{name:'Open TAP page context'}).click();
    await page.getByText('Active',{exact:true}).waitFor();
    const headerY=await page.locator('header').boundingBox();
    const statusY=await page.locator('.status').boundingBox();
    assert(statusY.height < 30);
    assert(Math.abs(statusY.y-headerY.y) < 12);
    assert(await page.getByText('fixture.ui',{exact:true}).isVisible());
    assert(await page.getByText('1.2.3',{exact:true}).isVisible());
    assert.equal(await page.getByRole('link',{name:'fixture.ui'}).getAttribute('href'),'https://github.com/inem/tap-pack-fixture-ui');
    assert.equal(await page.getByRole('link',{name:'tap.inspector'}).getAttribute('href'),'https://github.com/inem/tap-pack-inspector');
    assert(await page.getByText('Session archive',{exact:true}).isVisible());
    assert(await page.getByText('Versioned JSON',{exact:true}).isVisible());
    const folder=page.getByRole('button',{name:'Open data/readers/fixture.reader in Finder'});
    assert(await folder.isVisible());
    await folder.click();
    assert.deepEqual(await page.evaluate(()=>window.fixtureRequests),[{
      handler:'tap.inspector',args:{action:'reveal_folder',path:'data/readers/fixture.reader'},
    }]);
    assert(await page.getByText('Quick copy',{exact:true}).isVisible());
    assert(await page.getByText('2 controls',{exact:true}).isVisible());
    assert(await page.getByText('Live on this page',{exact:true}).isVisible());
    assert.equal(await page.getByText('Features',{exact:true}).count(),0);
    const readerGroup=page.getByRole('link',{name:'fixture.reader'}).locator('..').locator('..');
    assert(await readerGroup.getByText('Session archive',{exact:true}).isVisible());
    assert.equal(await page.getByText('Diagnostics',{exact:true}).count(),0);
    assert.equal(await page.getByText('Traffic capture runs independently from page features.',{exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:/Connect|Disconnect|Reconnect/}).count(),0);

    await page.evaluate(()=>window.fixtureMode='development');
    await page.getByText('Development',{exact:true}).waitFor();
    assert.equal(await lamp.locator('.development').count(),1);
    const inspected=await page.evaluate(async()=>({
      describe:await window.fixtureOperations.get('tap.inspector.describe')({}),
      query:await window.fixtureOperations.get('tap.inspector.query')({selector:'h1'}),
    }));
    assert.equal(inspected.describe.title,'');
    assert.equal(inspected.query[0].text,'Fixture');

    await page.evaluate(()=>window.fixtureActivity={pending:1,outbound:0,inbound:1,sequence:1});
    const activeTransport=page.getByRole('button',{name:'TAP transport active'});
    await activeTransport.waitFor();
    assert.equal(await activeTransport.locator('.dot').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(90, 169, 255)');
    assert.equal(await activeTransport.locator('.dot').evaluate(node=>getComputedStyle(node).animationName),'tap-transport-pulse');
    await page.evaluate(()=>window.fixtureActivity={pending:0,outbound:0,inbound:0,sequence:1});
    await page.waitForTimeout(800);
    await page.getByRole('button',{name:'Open TAP page context'}).waitFor();

    await page.evaluate(()=>window.fixtureValue='3 controls');
    await page.getByText('3 controls',{exact:true}).waitFor();
    await page.evaluate(()=>{window.fixtureBridgeState='ready';window.fixturePlanState='unavailable';});
    await page.getByText('Development',{exact:true}).waitFor();

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
