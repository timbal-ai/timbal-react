import * as React from "react";
import { MinusIcon } from "lucide-react";
import { unstable_OneTimePasswordField as OTPField } from "radix-ui";

import { controlClass } from "../design/control-surface";
import { cn } from "../utils";

function InputOTP({
  className,
  containerClassName,
  children,
  ...props
}: React.ComponentProps<typeof OTPField.Root> & {
  containerClassName?: string;
}) {
  return (
    <OTPField.Root
      data-slot="input-otp"
      className={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
        className,
      )}
      {...props}
    >
      {children}
    </OTPField.Root>
  );
}

function InputOTPGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  className,
  ...props
}: React.ComponentProps<typeof OTPField.Input>) {
  return (
    <OTPField.Input
      data-slot="input-otp-slot"
      className={cn(
        controlClass({ size: "sm" }),
        "size-9 text-center tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

function InputOTPHiddenInput({
  ...props
}: React.ComponentProps<typeof OTPField.HiddenInput>) {
  return <OTPField.HiddenInput data-slot="input-otp-hidden-input" {...props} />;
}

function InputOTPSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      data-slot="input-otp-separator"
      aria-hidden
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      <MinusIcon className="size-4" />
    </div>
  );
}

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPHiddenInput,
  InputOTPSeparator,
};
