/**
 * Super basic representation of a component tree.
 */
export type BasicComponentTree =
  | string
  | {
      type: string;
      components?: BasicComponentTree[];
    };

/**
 * Data structure representing a component in detail.
 */
export interface ComponentData {
  type: string;

  locked?: boolean;

  attributes?: any;
  classes?: string[];

  style?: any;

  components?: ComponentData[];
  content?: string;
}

export interface LayerTree {
  id: string;
  name: string;
  type: string;

  visible: boolean;
  locked: boolean;

  children?: LayerTree[];
}
