// Read-only statement guard: one SELECT/WITH statement, nothing else.
function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

export function assertReadOnlySql(sql) {
  if (typeof sql !== 'string') throw new Error('SQL must be a string');
  let body = stripComments(sql).trim();
  if (body.endsWith(';')) body = body.slice(0, -1).trimEnd();
  if (!/^(select|with)\b/i.test(body)) throw new Error('Only SELECT or WITH statements are allowed');
  // A WITH can also introduce an anonymous procedure (WITH p AS PROCEDURE ... CALL p()) or a DML statement; refuse both.
  if (/\bprocedure\b/i.test(body)) throw new Error('A WITH that defines a procedure is not allowed');
  if (/^with\b/i.test(body) && /\b(delete|insert|update|merge|create|drop|alter|truncate|call|copy|put|grant|revoke)\b/i.test(body.replace(/'(?:[^']|'')*'/g, "''"))) throw new Error('A WITH statement may only read');
  if (body.includes(';')) throw new Error('Multiple statements are not allowed');
  const trimmed = sql.trimEnd();
  return trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;
}
