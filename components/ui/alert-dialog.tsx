"use client";

import * as React from "react";
import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

export const AlertDialog = RadixAlertDialog.Root;
export const AlertDialogTrigger = RadixAlertDialog.Trigger;
export const AlertDialogPortal = RadixAlertDialog.Portal;

export function AlertDialogOverlay(props: React.ComponentProps<typeof RadixAlertDialog.Overlay>) {
  const { className, ...rest } = props;
  return (
    <RadixAlertDialog.Overlay
      className={cx(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out",
        className
      )}
      {...rest}
    />
  );
}

export function AlertDialogContent(props: React.ComponentProps<typeof RadixAlertDialog.Content>) {
  const { className, children, ...rest } = props;
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <RadixAlertDialog.Content
        className={cx(
          "fixed z-50 grid w-full max-w-md gap-4 rounded-md border bg-background p-6 shadow-lg",
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          className
        )}
        {...rest}
      >
        {children}
      </RadixAlertDialog.Content>
    </AlertDialogPortal>
  );
}

export function AlertDialogHeader({ className, ...props }: DivProps) {
  return <div className={cx("flex flex-col space-y-1 text-center sm:text-left", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: DivProps) {
  return <div className={cx("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />;
}

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof RadixAlertDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RadixAlertDialog.Title>
>(({ className, ...props }, ref) => (
  <RadixAlertDialog.Title ref={ref} className={cx("text-lg font-semibold", className)} {...props} />
));
AlertDialogTitle.displayName = RadixAlertDialog.Title.displayName;

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof RadixAlertDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RadixAlertDialog.Description>
>(({ className, ...props }, ref) => (
  <RadixAlertDialog.Description ref={ref} className={cx("text-sm text-muted-foreground", className)} {...props} />
));
AlertDialogDescription.displayName = RadixAlertDialog.Description.displayName;

export const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof RadixAlertDialog.Cancel>,
  React.ComponentPropsWithoutRef<typeof RadixAlertDialog.Cancel>
>(({ className, ...props }, ref) => (
  <RadixAlertDialog.Cancel
    ref={ref}
    className={cx(
      "inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium",
      "bg-background hover:bg-accent hover:text-accent-foreground",
      className
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = RadixAlertDialog.Cancel.displayName;

export const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof RadixAlertDialog.Action>,
  React.ComponentPropsWithoutRef<typeof RadixAlertDialog.Action>
>(({ className, ...props }, ref) => (
  <RadixAlertDialog.Action
    ref={ref}
    className={cx(
      "inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground",
      "hover:opacity-90",
      className
    )}
    {...props}
  />
));
AlertDialogAction.displayName = RadixAlertDialog.Action.displayName;