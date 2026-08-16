"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { createPaymentAction } from "@/lib/actions/payments";
import {
  RAZORPAY_CHECKOUT_SCRIPT,
  RAZORPAY_THEME_COLOR,
} from "@/lib/payments/razorpay";
import { useUiStore } from "@/hooks/useUiStore";
import type { RazorpayCheckoutOptions } from "@/types/razorpay";

interface RazorpayCheckoutLauncherProps {
  orderId: string;
  onProcessing: (paymentId?: string) => void;
  onDismissed: () => void;
  autoStart?: boolean;
  children?: (state: {
    startPayment: () => void;
    isStarting: boolean;
    scriptReady: boolean;
  }) => React.ReactNode;
}

export function RazorpayCheckoutLauncher({
  orderId,
  onProcessing,
  onDismissed,
  autoStart = false,
  children,
}: RazorpayCheckoutLauncherProps) {
  const { showToast } = useUiStore();
  const [scriptReady, setScriptReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  const startPayment = useCallback(async () => {
    if (!scriptReady || !window.Razorpay) {
      showToast("Payment is still loading. Please try again.", "error");
      return;
    }

    setIsStarting(true);

    try {
      const result = await createPaymentAction(orderId);

      if (!result.ok) {
        showToast(result.error.message, "error");
        onDismissed();
        return;
      }

      const { data } = result;

      const options: RazorpayCheckoutOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "Aasi",
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: data.prefill,
        theme: { color: RAZORPAY_THEME_COLOR },
        handler(response) {
          onProcessing(response.razorpay_payment_id);
        },
        modal: {
          ondismiss() {
            onDismissed();
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        onDismissed();
      });
      razorpay.open();
    } catch {
      showToast("Could not open payment. Please try again.", "error");
      onDismissed();
    } finally {
      setIsStarting(false);
    }
  }, [
    onDismissed,
    onProcessing,
    orderId,
    scriptReady,
    showToast,
  ]);

  useEffect(() => {
    if (!autoStart || !scriptReady || hasAutoStarted) {
      return;
    }

    setHasAutoStarted(true);
    void startPayment();
  }, [autoStart, hasAutoStarted, scriptReady, startPayment]);

  return (
    <>
      <Script
        src={RAZORPAY_CHECKOUT_SCRIPT}
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
      />
      {children
        ? children({ startPayment, isStarting, scriptReady })
        : null}
    </>
  );
}
