/**
 * The base class for all of the models
 */
export class Model {}

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
