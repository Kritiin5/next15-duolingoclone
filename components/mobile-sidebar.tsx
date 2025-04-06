import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle
} from "@/components/ui/sheet";

import { Sidebar } from "@/components/sidebar";
import { Menu } from "lucide-react";

export const MobileSidebar = () => {
    return (
        <Sheet>
            <SheetTrigger>
                <Menu className="text-white" />
            </SheetTrigger>
            <SheetContent className="p-0 z-[100]" side="left">
                {/* Accessible Title for the Sidebar */}
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle> 
                <Sidebar />
            </SheetContent>
        </Sheet>
    );
};
