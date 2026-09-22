(async () => {
  // A Gainsight-style book export for one OSM: 34 accounts, all five modules.
  const T = todayISO(), D = isoAddDays;
  const rows = [
    // name, product, stage, kickoffAgo, gradIn, contact, segment, arr, renewIn, notes
    ['Halcyon Biotherapeutics','Financial Reporting','TTFV-1',75,40,'Renee Castillo','Enterprise',310000,210,'10-K in Workiva by FY26 close'],
    ['Stonebridge Regional Bancorp','Financial Reporting','TTFV-2',120,18,'Marcus Webb','Mid-Market',145000,95,'Call report + 10-Q'],
    ['Cascade Timber Holdings','Sustainability','Kickoff',12,110,'Ingrid Solberg','Mid-Market',88000,340,'CSRD wave 2 filer'],
    ['Meridian Freight Partners','Carbon','TTFV-1',64,50,'Diego Alvarez','Enterprise',260000,160,'Scope 3 cat 4/9 heavy'],
    ['Orion Semiconductor','GRC','TTFV-2',140,12,'Priya Natarajan','Enterprise',420000,70,'SOX 404 controls migration'],
    ['Bluewater Utilities','Sustainability + Carbon','TTFV-1',80,35,'Hannah Okoro','Enterprise',380000,120,'ISSB S2 + CDP'],
    ['Pioneer Mutual Insurance','Financial Reporting','Kickoff',9,120,'Grant Feldman','Mid-Market',96000,355,'Stat reporting'],
    ['Tidewater Hospitality Group','GRC','TTFV-1',58,60,'Lucia Marchetti','Mid-Market',74000,200,'Internal audit mgmt'],
    ['Northwind Agritech','Carbon','TTFV-2',110,25,'Sven Lindqvist','Mid-Market',65000,140,'SBTi target setting'],
    ['Keystone Medical Devices','Financial Reporting','TTFV-1',70,45,'Alicia Brennan','Enterprise',290000,185,'10-K, proxy later'],
    ['Aurora Renewables','Sustainability','Graduation Ready',165,5,'Yusuf Adeyemi','Mid-Market',110000,60,''],
    ['Granite State Credit Union','Financial Reporting','TTFV-2',130,20,'Paula Dimitriou','SMB',42000,90,''],
    ['Lakeshore Consumer Brands','Sustainability + Carbon','TTFV-1',50,70,'Tomasz Nowak','Enterprise',340000,230,'CSRD + California SB 253'],
    ['Vantage Aerospace','GRC','Kickoff',20,100,'Karen Whitlock','Enterprise',510000,330,'ERM + SOX'],
    ['Redwood Capital REIT','Financial Reporting','TTFV-1',44,65,'Omar Haddad','Mid-Market',130000,250,''],
    ['Sable Creek Energy','Carbon','Kickoff',15,105,'Megan Tully','Mid-Market',72000,320,''],
    ['Brightline Staffing','GRC','TTFV-1',66,40,'Jonas Becker','SMB',38000,175,''],
    ['Evergreen Packaging Co','Sustainability','TTFV-2',125,15,'Chloe Martin','Mid-Market',92000,110,'Packaging EPR data'],
    ['Summit Health Partners','Financial Reporting','Graduation Ready',175,3,'Derek Olsen','Enterprise',275000,45,''],
    ['Coastal Water Authority','Sustainability','TTFV-1',90,30,'Nadia Rahman','Mid-Market',68000,150,''],
    ['Ironclad Logistics','Carbon','TTFV-1',72,38,'Victor Cruz','Mid-Market',84000,190,''],
    ['Pinnacle Foods International','Sustainability + Carbon','TTFV-2',150,10,'Elise Fournier','Enterprise',450000,80,'CSRD wave 1'],
    ['Crestview Bank','Financial Reporting','Kickoff',6,125,'Ben Adler','SMB',35000,360,''],
    ['Solaris Chemicals','GRC','TTFV-2',135,22,'Ravi Menon','Enterprise',360000,100,''],
    ['Harbor Point Retail','Sustainability','Kickoff',25,95,'Grace Liu','Mid-Market',70000,300,''],
    ['Atlas Mining Group','Sustainability + Carbon','TTFV-1',85,28,'Pieter de Vries','Enterprise',395000,140,'Two reporting entities'],
    ['Quantum Payments','Financial Reporting','TTFV-1',55,55,'Samira Khan','Mid-Market',120000,210,'IPO readiness'],
    ['Willow Creek Senior Living','GRC','Graduated',220,-30,'Frank Moretti','SMB',30000,150,''],
    ['Beacon Telecom','Financial Reporting','Graduated',240,-45,'Laura Kim','Enterprise',330000,200,''],
    ['Fjord Seafood ASA','Sustainability','Graduated',200,-20,'Astrid Hansen','Mid-Market',77000,260,''],
    ['Nexus Data Centers','Carbon','Kickoff',30,90,'Carlos Ibarra','Enterprise',215000,280,'Partner-led build (Deloitte)'],
    ['Riverside Pharma','Financial Reporting','Kickoff',40,85,'Hélène Dubois','Mid-Market',150000,270,'Partner-led build (KPMG)'],
    ['Titan Industrial REIT','GRC','Kickoff',22,110,'Wes Harlan','Mid-Market',99000,310,'Partner-led build (EY)'],
    ['Oakmont University Health','Sustainability','Kickoff',35,95,'Dr. Imani Brooks','Enterprise',180000,290,'Partner-led build (PwC)']
  ];
  const header = ['Company Name','Product','Onboarding Stage','Kickoff Date','Target Graduation Date','Primary Contact','GSID','Notes'];
  const aoa = [header].concat(rows.map((r, i) => [r[0], r[1], r[2], D(T, -r[3]), D(T, r[4]), r[5], 'GS-' + (100200 + i), r[9]]));
  window.__simRows = rows;
  if (typeof XLSX === 'undefined') return 'XLSX library not loaded (CDN)';
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Book');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const file = new File([buf], 'gainsight-book-export.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const input = document.getElementById('import-excel-input');
  if (!input) return 'no #import-excel-input in DOM (settings not open?)';
  const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 1200));
  // "Company Name" and "Onboarding Stage" are not auto-recognised; map them as a user would.
  const top = () => { const ms = [...document.querySelectorAll('.modal-backdrop')]; return ms[ms.length - 1]; };
  let s = top().querySelectorAll('select');
  s[0].value = 'Company Name'; s[0].dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  s = top().querySelectorAll('select');
  s[4].value = 'Onboarding Stage'; s[4].dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  [...top().querySelectorAll('button')].find(b => b.innerText.trim() === 'Import').click();
  await new Promise(r => setTimeout(r, 800));
  return 'excel import: ' + DATA.customers.length + ' accounts';
})()
