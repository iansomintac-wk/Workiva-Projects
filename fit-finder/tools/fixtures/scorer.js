/* fixture scorer: appends a line to the counter file named by SCORER_COUNTER, prints a fixed line */
require('fs').appendFileSync(process.env.SCORER_COUNTER, 'ran\n');
console.log('fixture line right 1 score 2');
process.exit(Number(process.env.SCORER_STATUS || 0));
