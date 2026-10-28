declare module '@sabaki/sgf' {
  export interface SgfNode { id: number; parentId: number | null; children: SgfNode[]; data: Record<string, string[]> }
  export function parse(input: string): SgfNode[]
  export function stringify(nodes: SgfNode[]): string
  export function parseVertex(input: string): [number, number]
  export function stringifyVertex(vertex: [number, number]): string
}
