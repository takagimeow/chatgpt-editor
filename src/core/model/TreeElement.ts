import { TreeElementData } from "./TreeElementData";

export interface TreeElement {
  data: TreeElementData;
  parentId?: string; // どのTreeElementに所属しているかを表すプロパティ
  childIds?: string[]; // rootのTreeElementにとって必要なプロパティ
}