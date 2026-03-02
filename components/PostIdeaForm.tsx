"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export function PostIdeaForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState("");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        category_tags: "",
        teaser_text: "",
        secret_content: "",
        price: 50,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = () => {
        setError("");
        if (step === 1) {
            if (!formData.title || formData.title.length < 10) {
                setError("Title must be at least 10 characters.");
                return;
            }
            if (!formData.teaser_text || formData.teaser_text.length < 50) {
                setError("Teaser must be at least 50 characters to properly explain the value.");
                return;
            }
        }
        if (step === 2) {
            if (formData.secret_content.length < 100) {
                setError("Secret content must be at least 100 characters to ensure detailed quality.");
                return;
            }
        }
        setStep(step + 1);
    };

    const submitIdea = async () => {
        if (Number(formData.price) < 50) {
            setError("Minimum price is ₹50.");
            return;
        }

        setLoading(true);
        setError("");

        // Show progress steps to user
        setLoadingStep("🔍 AI is reviewing your idea...");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // 60s max

        try {
            const res = await fetch("/api/ideas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    ...formData,
                    category_tags: formData.category_tags.split(",").map(t => t.trim()).filter(Boolean),
                    price: Number(formData.price)
                }),
            });

            clearTimeout(timeout);
            setLoadingStep("✅ Saving to marketplace...");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to post idea.");

            setStep(4);
            setTimeout(() => { router.push("/dashboard/seller"); }, 2000);

        } catch (err: any) {
            clearTimeout(timeout);
            if (err.name === "AbortError") {
                setError("Request timed out after 60s. The AI might be slow — try again.");
            } else {
                setError(err.message);
            }
            setStep(3);
        } finally {
            setLoading(false);
            setLoadingStep("");
        }
    };

    return (
        <div className="glass-card max-w-2xl mx-auto border-brand-blue/20 p-8 shadow-[0_0_40px_rgba(0,212,255,0.05)]">

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden relative">
                        <div className={`absolute left-0 top-0 h-full bg-gradient-to-r from-brand-blue to-brand-green transition-all duration-500 ease-out`} style={{ width: step >= s ? '100%' : '0%' }}></div>
                    </div>
                ))}
            </div>

            <h2 className="text-3xl font-bold mb-6">
                {step === 1 && "The Hook"}
                {step === 2 && "The Secret Engine"}
                {step === 3 && "Pricing & AI Vet"}
                {step === 4 && <span className="text-brand-green flex items-center gap-2"><CheckCircle /> Successfully Posted!</span>}
            </h2>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 text-sm font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Punchy Title</label>
                        <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Bypass JWT Expiration Natively" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Category Tags (comma separated)</label>
                        <input name="category_tags" value={formData.category_tags} onChange={handleChange} placeholder="Node.js, Security, Auth" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Public Teaser (Why does this matter?)</label>
                        <textarea name="teaser_text" value={formData.teaser_text} onChange={handleChange} rows={3} placeholder="Explain the problem and hint at your unique solution without giving it away..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all resize-none"></textarea>
                    </div>
                    <button onClick={handleNext} className="btn-accent w-full mt-4">Next Step</button>
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-lg p-4 mb-4 flex gap-3 text-brand-blue/90 text-sm leading-relaxed">
                        <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>This is your Micro-IP. This content is locked inside a secure vault and is NEVER sent to the client until it is purchased and unlocked via the Escrow protocol.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">The Secret Content / Solution</label>
                        <textarea name="secret_content" value={formData.secret_content} onChange={handleChange} rows={8} placeholder="Write the exact code, step-by-step logic, or hidden truth here..." className="w-full bg-black/50 border border-brand-green/30 rounded-lg p-4 font-mono text-brand-green focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all resize-none shadow-inner"></textarea>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => setStep(1)} className="btn-glass flex-1">Back</button>
                        <button onClick={handleNext} className="btn-accent flex-[2]">Lock & Next</button>
                    </div>
                </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Set Your Price (Min ₹50)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-xl font-bold text-white/50">₹</span>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} min="50" className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-2xl font-bold font-mono text-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all" />
                        </div>
                        <p className="text-xs text-white/40 mt-2">15% platform fee deducted upon successful 24h Escrow release.</p>
                    </div>

                    <div className="glass-card bg-black/20 p-4 border border-white/5">
                        <h4 className="text-xs text-white/50 uppercase tracking-wider mb-2 font-semibold">AI Vetting Protocol</h4>
                        <ul className="text-sm space-y-2 text-white/70">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-blue" /> Vector Mapping to category</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-blue" /> Gibberish Filtering</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-blue" /> Scam Pattern Detection</li>
                        </ul>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button onClick={() => setStep(2)} className="btn-glass flex-1" disabled={loading}>Back</button>
                        <button onClick={submitIdea} disabled={loading} className="btn-accent flex-[2] relative overflow-hidden group">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                    {loadingStep || "Vetting Idea..."}
                                </span>
                            ) : "Post Idea to Marketplace"}
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                    <p className="text-white/70 mb-2">Redirecting to Seller Dashboard...</p>
                </div>
            )}

        </div>
    );
}
