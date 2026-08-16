import {
  PageHeader as SharedPageHeader,
  type PageHeaderProps,
} from "@/components/shared/PageHeader";

/** Admin pages always render the v18 surface. */
export function PageHeader(props: Omit<PageHeaderProps, "surface">) {
  return <SharedPageHeader surface="admin" {...props} />;
}
