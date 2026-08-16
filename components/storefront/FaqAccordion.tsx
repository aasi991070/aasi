"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqGroup = {
  title: string;
  items: FaqItem[];
};

const FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Orders",
    items: [
      {
        question: "How do I place an order?",
        answer:
          "Browse the catalogue, open a product, choose your size and colour, and proceed to checkout when cart and payments are available.",
      },
      {
        question: "Can I change or cancel an order?",
        answer:
          "Contact us as soon as possible with your order number. Once an order enters packing we may not be able to amend it.",
      },
    ],
  },
  {
    title: "Shipping",
    items: [
      {
        question: "Where do you deliver?",
        answer:
          "We ship across India. Delivery timelines and partners are listed on our Shipping & Delivery page.",
      },
      {
        question: "How long does delivery take?",
        answer:
          "Standard delivery typically completes within [[DELIVERY_SLA]] of dispatch. Remote pin codes may take longer.",
      },
    ],
  },
  {
    title: "Returns",
    items: [
      {
        question: "What is your return window?",
        answer:
          "Eligible items may be returned within [[RETURN_WINDOW_DAYS]] of delivery, provided they are unworn and in original packaging.",
      },
      {
        question: "How do refunds work?",
        answer:
          "Approved refunds are processed to the original payment method within [[REFUND_WINDOW_DAYS]] of us receiving the return.",
      },
    ],
  },
  {
    title: "Product Care",
    items: [
      {
        question: "How should I care for my garments?",
        answer:
          "Follow the care label inside each piece. When in doubt, dry clean or hand wash in cold water and dry flat.",
      },
      {
        question: "Do colours match the website exactly?",
        answer:
          "We photograph every piece in natural light, but screen settings can shift tone slightly. Contact us if you need fabric swatches.",
      },
    ],
  },
];

export function FaqAccordion() {
  return (
    <div className="space-y-10">
      {FAQ_GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="font-display text-2xl font-normal text-store-ink">
            {group.title}
          </h2>
          <Accordion
            type="single"
            collapsible
            className="mt-4 border-t border-store-border"
          >
            {group.items.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`${group.title}-${index}`}
                className="border-store-border"
              >
                <AccordionTrigger className="font-sans text-sm font-normal text-store-ink hover:no-underline [&>svg]:text-store-ink-muted">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm leading-relaxed text-store-ink-muted">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );
}
