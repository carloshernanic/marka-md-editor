export type Doc = {
  id: string;
  title: string;
  /** Markdown source of the document. */
  content: string;
  createdAt: number;
  updatedAt: number;
  /** True once the user renamed the document by hand; stops auto-titling. */
  manualTitle?: boolean;
};

export type Theme = "light" | "dark";
