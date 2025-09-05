/**
 * Super basic representation of a component tree.
 */
export type BasicComponentTree =
  | string
  | {
      type: string;
      components?: BasicComponentTree[];
    };

export interface LayerTree {
  id: string;
  name: string;
  type: string;

  visible: boolean;
  locked: boolean;

  children?: LayerTree[];
}
