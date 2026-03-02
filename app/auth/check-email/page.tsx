import Link from "next/link";
import { Mail } from "lucide-react";

export default function CheckEmailPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="glass-card max-w-md w-full text-center !p-10 space-y-5">
                <div className="w-16 h-16 rounded-full bg-brand-blue/20 flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-brand-blue" />
                </div>
                <h1 className="text-2xl font-extrabold">Check Your Email</h1>
                <p className="text-white/60 text-sm leading-relaxed">
                    We sent a confirmation link to your email address. Click it to activate your Synapse account.
                </p>
                <Link href="/auth/login">
                    <button className="btn-glass text-sm mt-4">Back to Login →</button>
                </Link>
            </div>
        </div>
    );
}
