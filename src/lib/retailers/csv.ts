/** Strict RFC-style CSV parsing, including quoted commas, escaped quotes, and CRLF. */
export function parseCsv(contents: string): string[][] {
  const text = contents.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let state: "unquoted" | "quoted" | "closed" = "unquoted";

  const finishRow = () => {
    row.push(field);
    if (row.length > 100) throw new Error("CSV column limit exceeded");
    // Ignore completely blank lines; comma-only rows remain records to validate.
    if (row.length !== 1 || row[0] !== "") rows.push(row);
    row = [];
    field = "";
    state = "unquoted";
    if (rows.length > 20_001) throw new Error("CSV row limit exceeded");
  };

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (state === "quoted") {
      if (character === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else state = "closed";
      } else field += character;
      continue;
    }
    if (character === ",") {
      row.push(field);
      if (row.length > 100) throw new Error("CSV column limit exceeded");
      field = "";
      state = "unquoted";
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[i + 1] === "\n") i++;
      finishRow();
    } else if (character === '"' && field === "" && state === "unquoted") state = "quoted";
    else if (character === '"' || state === "closed") throw new Error("Invalid CSV quoting");
    else field += character;
  }
  if (state === "quoted") throw new Error("Unterminated CSV field");
  if (field !== "" || row.length > 0 || state === "closed") finishRow();
  return rows;
}
