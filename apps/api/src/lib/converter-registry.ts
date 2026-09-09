import type { ConverterDefinition, ConverterCategory } from "@filetools/types";

interface ConverterEntry {
  definition: ConverterDefinition;
  workerQueue: string;
}

const converters = new Map<string, ConverterEntry>();

export function registerConverter(definition: ConverterDefinition, workerQueue: string): void {
  converters.set(definition.id, { definition, workerQueue });
}

export function getConverter(id: string): ConverterEntry | undefined {
  return converters.get(id);
}

export function getAllConverters(): ConverterDefinition[] {
  return Array.from(converters.values()).map((e) => e.definition);
}

export function getConvertersByCategory(category: ConverterCategory): ConverterDefinition[] {
  return getAllConverters().filter((c) => c.category === category);
}

export function findConverter(inputFormat: string, outputFormat: string): ConverterEntry | undefined {
  for (const entry of converters.values()) {
    const inputMatch = entry.definition.inputFormats.includes(inputFormat.toLowerCase());
    const outputMatch = entry.definition.outputFormats.includes(outputFormat.toLowerCase());
    if (inputMatch && outputMatch) return entry;
  }
  return undefined;
}

export function getWorkerQueue(converterId: string): string | undefined {
  return converters.get(converterId)?.workerQueue;
}
