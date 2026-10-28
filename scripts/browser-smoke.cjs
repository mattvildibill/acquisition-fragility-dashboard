const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4180/';
(async () => {
 const browser = await chromium.launch({...(process.env.BROWSER_EXECUTABLE_PATH ? {executablePath:process.env.BROWSER_EXECUTABLE_PATH} : {}),headless:true,args:['--no-sandbox']});
 const context = await browser.newContext({viewport:{width:1440,height:1000}});
 const page = await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(baseUrl);
 assert.equal(await page.locator('.score-value').innerText(),'79');
 for(const width of [320,390,768,1024,1440]) {
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
 }
 await page.getByRole('button',{name:'Deactivate Cobalt Dynamics',exact:true}).click();
 await page.getByRole('button',{name:/Aegis Communications Node/}).first().click();
 assert.equal(await page.locator('.score-value').innerText(),'55');
 assert.match(await page.locator('.restore-banner').innerText(),/64 wks/);
 assert.deepEqual(await page.locator('.comparison-score').allTextContents(), ['71','55','71','84']);
 assert.match(await page.locator('.residual-note').innerText(), /Secure RF Modem/);
 assert.match(await page.locator('.path-list').innerText(), /Cobalt Dynamics.*Secure RF Modem.*Aegis Communications Node.*Falcon Precision Munition/s);
 assert.match(await page.locator('.comparison-horizon').innerText(), /after qualification completes.*Synthetic weeks/s);
 await page.getByText('Qualification assumptions & calculation evidence',{exact:true}).click();
 assert.match(await page.locator('.comparison-evidence').innerText(), /Composite Airframe Panel: 10 weeks/);
 for(const width of [320,390,768,1024,1440]) {
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
 }
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const disruptedA11y=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 assert.deepEqual(disruptedA11y.violations.map(v=>v.id),[]);
 await page.getByRole('button',{name:'Falcon Precision Munition',exact:true}).focus();
 await page.keyboard.press('Enter');
 assert.match(await page.locator('.comparison-panel h2').innerText(), /Falcon/);
 await page.getByRole('button',{name:'Aegis Communications Node',exact:true}).click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied')}}}));
 await page.getByRole('button',{name:'Copy link to this scenario'}).click();
 const link=await page.getByRole('textbox',{name:'Scenario link'}).inputValue();
 await page.goto(link);
 await page.getByRole('button',{name:/Aegis Communications Node/}).first().click();
 assert.equal(await page.locator('.score-value').innerText(),'55');
 await page.getByRole('button',{name:'Reset to baseline'}).click();
 assert.equal(await page.locator('.score-value').innerText(),'71');
 assert(!new URL(page.url()).searchParams.has('sc'));
 await page.goto(new URL('?sc=%25%3A1',baseUrl).href);
 assert.match(await page.getByRole('status').innerText(),/incomplete or invalid/);
 assert.equal(await page.locator('.score-value').innerText(),'79');
 await page.getByRole('button',{name:'Reset to baseline'}).click();
 // All producers down; reserve suppliers remain available for qualification.
 while(await page.getByRole('button',{name:/^Deactivate /}).count()) await page.getByRole('button',{name:/^Deactivate /}).first().click();
 assert.equal(await page.locator('.score-value').innerText(),'10');
 while(await page.getByRole('button',{name:/^Activate /}).count()) await page.getByRole('button',{name:/^Activate /}).first().click();
 assert.equal(await page.locator('.score-value').innerText(),'100');
 assert.equal(await page.locator('.restore-banner').count(),0);
 await page.getByRole('button',{name:'Reset to baseline'}).click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise(r=>window.finishCopy=r)}}));
 await page.getByRole('button',{name:'Copy link to this scenario'}).click();
 await page.getByRole('button',{name:'Deactivate Cobalt Dynamics',exact:true}).click();
 await page.evaluate(()=>window.finishCopy());
 assert.equal(await page.getByRole('button',{name:'Link copied',exact:true}).count(),0);
 await page.getByRole('button',{name:'Reset to baseline'}).click();
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const a11y=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 console.log('Axe violations:',JSON.stringify(a11y.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))));
 assert.equal(a11y.violations.length,0);
 await page.setViewportSize({width:390,height:844});
 assert.deepEqual(errors,[]);
 console.log('PASS: 5 widths; baseline; Cobalt/Aegis; share roundtrip; clipboard denial and stale completion; malformed link; reset; all-off/all-on; axe; no runtime errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
