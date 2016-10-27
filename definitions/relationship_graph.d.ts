import Model from './model';
import { IJoin } from './types';
export interface IOptions {
    name: string;
    multiple: boolean;
    as: string;
    via: string;
}
export declare class RelationshipPath {
    private 'constructor';
    path: (RelationshipEdge | RelationshipNode)[];
    constructor(path: (RelationshipEdge | RelationshipNode)[]);
    toString(): string;
    joinName(reverse?: boolean): string;
    add(node: RelationshipNode, edge: RelationshipEdge): RelationshipPath;
    getModel(): typeof Model;
    multiple(): boolean;
    immediateMultiple(): boolean;
    joins(alias?: string | null, firstTable?: string): IJoin[];
}
export declare class RelationshipNode {
    Graph: RelationshipGraph;
    Model: typeof Model;
    edges: RelationshipEdge[];
    constructor(Graph: RelationshipGraph, mModel: typeof Model);
    toString(): string;
    joinsTo(mModel: typeof Model, options: IOptions): RelationshipEdge | null;
    childEdges(): RelationshipEdge[];
    cascade(): RelationshipPath[];
    findExplicit(pathname: string): RelationshipPath | null;
    find(name: string): RelationshipPath | null;
}
export declare class RelationshipEdge {
    id: number;
    parent: RelationshipNode;
    child: RelationshipNode;
    options: IOptions;
    constructor(parent: RelationshipNode, child: RelationshipNode, options: IOptions);
    toString(): string;
    hasChild(child: RelationshipNode): boolean;
    hasParent(parent: RelationshipNode): boolean;
    opposite(node: RelationshipNode): RelationshipNode | null;
}
export default class RelationshipGraph {
    nodes: RelationshipNode[];
    edges: RelationshipEdge[];
    constructor();
    of(mModel: typeof Model): RelationshipNode;
}
