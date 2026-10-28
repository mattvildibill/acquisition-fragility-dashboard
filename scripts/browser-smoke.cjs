const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4180/';
(async () => {
 const browser = await chromium.launch({...(process.env.BROWSER_EXECUTABLE_PATH ? {executablePath:process.env.BROWSER_EXECUTABLE_PATH} : {}),headless:true,args:['--no-sandbox']});
 const context = await browser.newContext({viewport:{width:1440,height:1000}});
 const page = await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const supplier = page.getByLabel('1. Change a supplier');
 const program = page.getByLabel('2. Inspect a program');
 const scores = () => page.locator('.comparison-score').allTextContents();
 const toggle = async id => { await supplier.selectOption(id); await page.locator('.supplier-control button').click(); };
 const widths = async () => { for(const width of [320,390,768,1024,1440]) {
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
  if(width < 650) {
   assert.equal(await page.getByRole('region',{name:'Quick outcome'}).isVisible(),true);
   assert((await page.getByRole('region',{name:'Quick outcome'}).boundingBox()).y < 700);
  }
 }};
 const axeCheck = async () => {
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const result=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  assert.deepEqual(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
 };
 await page.goto(baseUrl);
 assert.deepEqual((await scores()).slice(0,2),['71','71']);
 assert.equal(await page.locator('section[aria-label="Full dependency model"]').isVisible(),true);
 assert.equal(await page.locator('.model-row').count(),3);
 assert.equal(await page.locator('.model-supplier').count(),7);
 await widths(); await axeCheck();
 // One deliberate action reveals the Cobalt/Aegis walkthrough.
 await page.getByRole('button',{name:'Deactivate Cobalt Dynamics',exact:true}).click();
 assert.deepEqual(await scores(),['71','55','71','84']);
 assert.match(await page.locator('.residual-note').innerText(),/Secure RF Modem/);
 assert.deepEqual(await page.locator('.path-list button').allTextContents(),['Aegis Communications Node','Falcon Precision Munition']);
 assert.match(await page.locator('.comparison-horizon').innerText(),/after qualification completes.*Synthetic weeks/s);
 await page.getByRole('button',{name:/Secure RF Modem.*criticality/}).click();
 assert.deepEqual(await page.locator('.model-shared button').allTextContents(),['Aegis Communications Node','Falcon Precision Munition']);
 await page.locator('.model-shared').getByRole('button',{name:'Falcon Precision Munition',exact:true}).focus();
 await page.keyboard.press('Enter');
 assert.equal(await program.inputValue(),'p3');
 await program.selectOption('p2');
 await page.getByText('How these choices are calculated',{exact:true}).click();
 assert.match(await page.locator('.comparison-evidence').innerText(),/Composite Airframe Panel: 10 weeks/);
 await widths(); await axeCheck();
 await page.getByText('How these choices are calculated',{exact:true}).click();
 // Technical detail is available on demand, with native modal focus and Escape.
 await page.getByRole('button',{name:'Inspect calculations'}).click();
 assert.equal(await page.locator('.score-value').innerText(),'55');
 assert.match(await page.locator('.restore-banner').innerText(),/64 wks/);
 await axeCheck();
 await page.getByRole('button',{name:'Supplier rankings',exact:true}).click();
 await axeCheck();
 await page.keyboard.press('Escape');
 assert.equal(await page.getByRole('dialog').count(),0);
 assert.equal(await page.getByRole('button',{name:'Inspect calculations'}).evaluate(e=>e===document.activeElement),true);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied')}}}));
 await page.getByRole('button',{name:'Copy link to this scenario'}).click();
 const link=await page.getByRole('textbox',{name:'Scenario link'}).inputValue();
 await page.goto(link);
 assert.deepEqual(await scores(),['71','55','71','84']);
 await page.getByRole('button',{name:'Reset to baseline'}).click();
 assert.equal((await scores())[1],'71');
 assert(!new URL(page.url()).searchParams.has('sc'));
 await page.goto(new URL('?sc=%25%3A1',baseUrl).href);
 assert.match(await page.getByRole('status').innerText(),/incomplete or invalid/);
 assert.equal((await scores())[1],'71');
 await page.getByRole('button',{name:'Reset to baseline'}).click();
 // All producers down; reserves remain available. Then every supplier on.
 const ids=await supplier.locator('option').evaluateAll(options=>options.map(o=>o.value));
 for(const id of ids) {
  await supplier.selectOption(id);
  if((await supplier.locator('option:checked').innerText()).endsWith('· Active')) await page.locator('.supplier-control button').click();
 }
 assert.equal((await scores())[1],'10');
 for(const id of ids) await toggle(id);
 assert.equal((await scores())[1],'100');
 await page.getByRole('button',{name:'Reset to baseline'}).click();
 await toggle('s12');
 await program.selectOption('p4');
 assert.deepEqual(await scores(),['65','39','52','61']);
 assert.equal(await page.locator('.model-row').count(),4);
 assert.equal(await page.locator('.model-supplier').count(),7);
 assert.match(await page.locator('.residual-note').first().innerText(),/Radiation-Tolerant Controller/);
 await page.getByRole('button',{name:/Precision Timing Module.*criticality/}).click();
 assert.deepEqual(await page.locator('.model-shared button').allTextContents(),['Orbital Relay Demonstrator','Field Sensor Gateway']);
 await widths(); await axeCheck();
 await page.locator('.model-shared').getByRole('button',{name:'Field Sensor Gateway',exact:true}).click();
 assert.deepEqual(await scores(),['70','50','80','80']);
 await page.getByRole('button',{name:'Reset to baseline'}).click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise(r=>window.finishCopy=r)}}));
 await page.getByRole('button',{name:'Copy link to this scenario'}).click();
 await toggle('s3'); await page.evaluate(()=>window.finishCopy());
 assert.equal(await page.getByRole('button',{name:'Link copied',exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: 5 widths; permanent mapped edges; Cobalt and Juniper recovery; keyboard shared-program selection; modal focus/Escape; share roundtrip and failures; all-off/all-on; baseline/disrupted/dialog axe; no runtime errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
