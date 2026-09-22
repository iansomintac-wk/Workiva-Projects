(async () => {
  [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Settings').click();
  await new Promise(r => setTimeout(r, 400));
  return document.getElementById('import-excel-input') ? 'settings open' : 'FAIL: no #import-excel-input';
})()
