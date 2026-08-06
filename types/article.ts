import type { PortableTextBlock } from "@portabletext/react";

import type { EditorialImage, SeoData } from "@/types/content";

export type ArticleCategory =
  | "Culture"
  | "Training"
  | "Competition"
  | "Athlete Journal"
  | "Field Note"
  | "Analysis";

export type ArticleHeroVariant = "signal" | "field" | "frame";

export type ArticleParagraphBlock = {
  readonly type: "paragraph";
  readonly text: string;
};

export type ArticleHeadingBlock = {
  readonly type: "heading";
  readonly text: string;
  readonly id?: string;
};

export type ArticleSubheadingBlock = {
  readonly type: "subheading";
  readonly text: string;
  readonly id?: string;
};

export type ArticlePullQuoteBlock = {
  readonly type: "pullQuote";
  readonly quote: string;
  readonly attribution?: string;
};

export type ArticleFactBoxBlock = {
  readonly type: "factBox";
  readonly title: string;
  readonly items: readonly string[];
};

export type ArticleListBlock = {
  readonly type: "list";
  readonly style: "ordered" | "unordered";
  readonly items: readonly string[];
};

export type ArticleDividerBlock = {
  readonly type: "divider";
  readonly label?: string;
};

export type ArticleCalloutBlock = {
  readonly type: "callout";
  readonly label: string;
  readonly title?: string;
  readonly text: string;
};

export type ArticleBlock =
  | ArticleParagraphBlock
  | ArticleHeadingBlock
  | ArticleSubheadingBlock
  | ArticlePullQuoteBlock
  | ArticleFactBoxBlock
  | ArticleListBlock
  | ArticleDividerBlock
  | ArticleCalloutBlock;

export type PortableTextPullQuote = {
  readonly _type: "pullQuote";
  readonly _key?: string;
  readonly quote: string;
  readonly attribution?: string;
};

export type PortableTextFactBox = {
  readonly _type: "factBox";
  readonly _key?: string;
  readonly heading: string;
  readonly title?: string;
  readonly items: readonly string[];
};

export type PortableTextDivider = {
  readonly _type: "divider";
  readonly _key?: string;
  readonly label?: string;
};

export type PortableTextEditorialImage = {
  readonly _type: "editorialImage";
  readonly _key?: string;
  readonly image: EditorialImage;
};

export type ArticlePortableTextBlock =
  | PortableTextBlock
  | PortableTextPullQuote
  | PortableTextFactBox
  | PortableTextDivider
  | PortableTextEditorialImage;

export type Article = {
  readonly slug: string;
  readonly title: string;
  readonly dek: string;
  readonly category: ArticleCategory;
  readonly author: string;
  readonly publicationDate: string;
  readonly displayDate: string;
  readonly readTime: string;
  readonly location: string;
  readonly featured: boolean;
  readonly homepageFeatured: boolean;
  readonly issueNumber: string;
  readonly tags: readonly string[];
  readonly heroVariant: ArticleHeroVariant;
  readonly heroLabel: string;
  readonly prototypeNotice: string;
  readonly body: readonly ArticleBlock[];
  readonly portableBody?: readonly ArticlePortableTextBlock[];
  readonly relatedSlugs: readonly string[];
  readonly image?: EditorialImage;
  readonly seo?: SeoData;
};
