"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SignOutButton({ variant = "glass", ...props }: ButtonProps) {
  const [loading, setLoading] = React.useState(false);
  return (
    <Button
      variant={variant}
      loading={loading}
      onClick={() => {
        setLoading(true);
        void signOut({ callbackUrl: "/" });
      }}
      {...props}
    >
      {!loading && <LogOut />}
      Sign out
    </Button>
  );
}
