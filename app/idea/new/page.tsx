import { PostIdeaForm } from "@/components/PostIdeaForm";

export default function NewIdeaPage() {
    return (
        <div className="py-8">
            <div className="text-center space-y-4 mb-10">
                <h1 className="text-4xl font-extrabold pb-2 bg-gradient-to-r from-brand-blue to-white bg-clip-text text-transparent inline-block">Monetize Your Brain</h1>
                <p className="text-white/60">Share your hidden solutions, bypasses, or micro-frameworks and get paid automatically.</p>
            </div>

            <PostIdeaForm />
        </div>
    );
}
