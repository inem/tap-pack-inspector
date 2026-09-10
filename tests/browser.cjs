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
 const page=await browser.newPage();await page.route('**/*',r=>r.fulfill({body:'<!doctype html><h1>Fixture</h1>',contentType:'text/html'}));
 await page.goto('https://fixture.example');
 const code=fs.readFileSync('artifacts/tap-inspector-0.2.0-built/pack/page.js','utf8');
 await page.addScriptTag({content:code});
 await page.getByRole('button',{name:'TAP: открыть контекст страницы'}).click();
 assert(await page.getByText('Мост не загружен',{exact:true}).isVisible());
 await page.evaluate(()=>{window.TapBridge={isReady:()=>true};window.fixtureValue='Первое';window.fixtureKey=Symbol();window[Symbol.for('tap.page.observations.v1')].set(window.fixtureKey,()=>[{label:'Материал',value:window.fixtureValue}]);});
 await page.getByText('Первое',{exact:true}).waitFor();assert(await page.getByText('Подключена',{exact:true}).isVisible());
 await page.evaluate(()=>window.fixtureValue='Изменилось');await page.getByText('Изменилось',{exact:true}).waitFor();
 await page.evaluate(()=>{window[Symbol.for('tap.page.observations.v1')].delete(window.fixtureKey);window.TapBridge.isReady=()=>false;});
 await page.getByText('Не подключена · обновите страницу для управления',{exact:true}).waitFor();assert.equal(await page.getByText('Материал',{exact:true}).count(),0);
 await page.evaluate(()=>{
 window.fixtureBridgeState='ready';
 window.TapBridge={isReady:()=>window.fixtureBridgeState==='ready',status:()=>({state:window.fixtureBridgeState,actions:[window.fixtureBridgeState==='paused'?'connect':'disconnect']}),disconnect:()=>window.fixtureBridgeState='paused',connect:()=>window.fixtureBridgeState='ready'};
 });
 await page.getByRole('button',{name:'Отключить в этой вкладке',exact:true}).click();
 await page.getByText('Отключена в этой вкладке',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Подключить',exact:true}).click();
 await page.getByText('Подключена',{exact:true}).waitFor();
 await page.keyboard.press('Escape');assert.equal(await page.locator('[aria-label="TAP: контекст страницы"]').isVisible(),false);
 await page.addScriptTag({content:code});assert.equal(await page.locator('[data-tap-inspector]').count(),1);
 await page.evaluate(()=>window.__tapInspector.dispose());assert.equal(await page.locator('[data-tap-inspector]').count(),0);
 console.log('PASS: absent/ready/disconnected bridge, dynamic contribution/change/removal, Escape, reinjection, disposal');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
