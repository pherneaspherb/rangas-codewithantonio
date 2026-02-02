import { Plus } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

export const Navbar = () => {
  return (
    <nav className="fixed z-50 top-0 w-full h-14 border-b shadow-sm bg-white">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="hidden md:flex">
          <Logo />
        </div>

        {/* Center: Action Buttons */}
        <div className="hidden md:flex gap-2">
          <Button size="sm">Create</Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Organization & User */}
        <div className="ml-auto flex items-center gap-x-2">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/organization/:id"
            afterLeaveOrganizationUrl="/select-org"
            afterSelectOrganizationUrl="/organization/:id"
            appearance={{
              elements: {
                rootBox: {
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },
              },
            }}
          />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: {
                  height: 30,
                  width: 30,
                },
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
};

//2:04:31
