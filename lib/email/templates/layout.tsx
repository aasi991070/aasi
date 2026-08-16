import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { SITE_URL } from "@/constants";
import { EMAIL_COLORS, EMAIL_FONT_FAMILY, EMAIL_SANS } from "@/lib/email/constants";

interface EmailLayoutProps {
  preview: string;
  title: string;
  children: ReactNode;
}

export function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Aasi</Text>
          <Heading style={styles.title}>{title}</Heading>
          {children}
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            Questions? Reply to this email or visit our{" "}
            <Link href={`${SITE_URL}/contact`} style={styles.link}>
              contact page
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const styles = {
  body: {
    backgroundColor: EMAIL_COLORS.surface,
    fontFamily: EMAIL_SANS,
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: EMAIL_COLORS.white,
    border: `1px solid ${EMAIL_COLORS.border}`,
    borderRadius: "8px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "32px",
  },
  brand: {
    color: EMAIL_COLORS.accent,
    fontFamily: EMAIL_FONT_FAMILY,
    fontSize: "28px",
    letterSpacing: "0.12em",
    margin: "0 0 24px",
    textTransform: "uppercase" as const,
  },
  title: {
    color: EMAIL_COLORS.ink,
    fontFamily: EMAIL_FONT_FAMILY,
    fontSize: "24px",
    fontWeight: 400,
    lineHeight: "1.3",
    margin: "0 0 16px",
  },
  paragraph: {
    color: EMAIL_COLORS.inkMuted,
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 16px",
  },
  strong: {
    color: EMAIL_COLORS.ink,
  },
  hr: {
    borderColor: EMAIL_COLORS.border,
    margin: "24px 0",
  },
  footer: {
    color: EMAIL_COLORS.inkMuted,
    fontSize: "12px",
    lineHeight: "1.5",
    margin: 0,
  },
  link: {
    color: EMAIL_COLORS.accentDark,
    textDecoration: "underline",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    margin: "16px 0",
  },
  row: {
    borderBottom: `1px solid ${EMAIL_COLORS.border}`,
  },
  cell: {
    color: EMAIL_COLORS.inkMuted,
    fontSize: "14px",
    padding: "10px 0",
    verticalAlign: "top" as const,
  },
  cellRight: {
    color: EMAIL_COLORS.ink,
    fontSize: "14px",
    padding: "10px 0",
    textAlign: "right" as const,
    verticalAlign: "top" as const,
  },
  totalRow: {
    color: EMAIL_COLORS.ink,
    fontSize: "16px",
    fontWeight: 600,
    padding: "12px 0 0",
    textAlign: "right" as const,
  },
};

export function OrderLinesSection({
  lines,
  subtotal,
  discount,
  shippingFee,
  tax,
  total,
}: {
  lines: { name: string; qty: number; lineTotal: string }[];
  subtotal: string;
  discount: string;
  shippingFee: string;
  tax: string;
  total: string;
}) {
  return (
    <Section>
      <table style={styles.table}>
        <tbody>
          {lines.map((line) => (
            <tr key={`${line.name}-${line.qty}`} style={styles.row}>
              <td style={styles.cell}>
                {line.name} × {line.qty}
              </td>
              <td style={styles.cellRight}>{line.lineTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Text style={styles.paragraph}>
        Subtotal: <span style={styles.strong}>{subtotal}</span>
        {discount !== "₹0.00" ? (
          <>
            {" "}
            · Discount: <span style={styles.strong}>{discount}</span>
          </>
        ) : null}
        {" "}
        · Shipping: <span style={styles.strong}>{shippingFee}</span> · Tax:{" "}
        <span style={styles.strong}>{tax}</span>
      </Text>
      <Text style={styles.totalRow}>Total paid: {total}</Text>
    </Section>
  );
}
