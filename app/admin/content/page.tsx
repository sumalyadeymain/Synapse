"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { deleteIdea } from "./actions";

interface Idea {
    id: string;
    title: string;
    teaser_text: string;
    price: number;
    created_at: string;
    profiles: { username: string } | null;
}

export default function AdminContentPage() {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchIdeas = async () => {
            try {
                // Fetch all ideas
                const res = await fetch('/api/ideas');
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to fetch ideas');
                setIdeas(data.ideas || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchIdeas();
    }, []);

    const handleDelete = async (ideaId: string) => {
        if (!confirm('Are you sure you want to delete this idea? This action cannot be undone.')) return;

        try {
            const res = await deleteIdea(ideaId);
            if (res.error) throw new Error(res.error);
            setIdeas(ideas.filter(i => i.id !== ideaId));
        } catch (err: any) {
            alert(`Failed to delete idea: ${err.message}`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <FileText className="w-8 h-8 text-brand-purple" /> Content Moderation
                </h1>
                <p className="text-white/50 text-sm mt-1">Review and manage posted ideas.</p>
            </div>

            {loading && <div className="text-white/50 text-sm animate-pulse">Loading ideas...</div>}

            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500 text-red-500 rounded-xl font-bold">
                    Error loading content: {error}
                </div>
            )}

            {!loading && !error && (
                <div className="space-y-4">
                    {ideas.length === 0 ? (
                        <div className="text-white/50 border border-white/10 rounded-2xl p-8 text-center border-dashed">
                            No ideas posted yet.
                        </div>
                    ) : (
                        ideas.map(idea => (
                            <div key={idea.id} className="glass-card p-5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                <div className="space-y-2 flex-1">
                                    <h3 className="text-lg font-bold text-white leading-tight">{idea.title}</h3>
                                    <p className="text-sm text-white/50 line-clamp-2">{idea.teaser_text}</p>
                                    <div className="flex items-center gap-4 text-xs font-medium text-white/40">
                                        <span>By: <span className="text-brand-blue">{idea.profiles?.username || 'Unknown'}</span></span>
                                        <span>₹{idea.price}</span>
                                        <span>Posted: {new Date(idea.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(idea.id)}
                                    className="shrink-0 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-all group"
                                    title="Delete Idea"
                                >
                                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
