import { AuthProvider } from "@/hooks/useAuth";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="min-h-screen flex flex-col bg-[#09090B]">
                <Header />
                <div className="grow pt-24 pb-16">
                    {children}
                </div>
                <Footer />
            </div>
        </AuthProvider>
    );
}
