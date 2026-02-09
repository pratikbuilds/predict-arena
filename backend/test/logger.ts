export function logSection(title: string): void {
  console.log(`--- ${title} ---`);
}

export function logKV(key: string, value: unknown, indent = 2): void {
  const padding = " ".repeat(indent);
  console.log(`${padding}${key}: ${value}`);
}

export function logBlank(): void {
  console.log("");
}
