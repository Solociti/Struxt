export interface FormDetails {
  /**
   * the form name to display
   */
  formName: string;

  enabled: boolean;

  /**
   * the number of submissions in the last 30 days for the production
   * environments.
   */
  submissionCount: number;
}
