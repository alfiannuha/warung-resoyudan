import AppBarWrapper from "./app-bar-wrapper";
import SideNavDrawer from "@/components/layout/side-nav-drawer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppBarWrapper />
      <SideNavDrawer />
      <main className="pt-[48px] pb-4 px-container-padding mx-auto w-full flex-1 min-h-screen [&:has(.kasir-layout)]:pt-0 [&:has(.kasir-layout)]:px-0">
        {children}
      </main>
    </>
  );
}
