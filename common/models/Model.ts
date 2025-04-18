/**
 * The base class for all of the models
 */
export class Model {
  clone(): Model {
    return new Model();
  }
}

/**
 * The base model action for any actions such as,
 * creating, deleting, updating, etc.
 *
 * This is used to track the actions
 */
export interface ModelAction {
  active: boolean;

  date: number;
}

/**
 * Same as the ModelAction but with the userId and displayName
 */
export interface UserModelAction extends ModelAction {
  userId: string;
  displayName: string;
}

/**
 * Utility type to extract keys of properties that are not functions.
 */
type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * Utility type to create a type with only the non-function properties of T.
 */
export type DataPropsOnly<T> = Pick<T, NonFunctionPropertyNames<T>>;

/**
 * Represents the model type T as it would be stored in a document database,
 * including an optional _id and excluding any methods.
 */
export type ModelAsDocument<T> = DataPropsOnly<T> & {
  _id?: string;
};
