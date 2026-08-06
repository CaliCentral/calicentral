export type ActionResult = {
  readonly success: boolean;
  readonly message: string;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
  readonly formError?: string;
  readonly redirectTo?: string;
  readonly recordId?: string;
  readonly submissionNumber?: string;
};

export const initialActionState: ActionResult = {
  success: false,
  message: "",
};
