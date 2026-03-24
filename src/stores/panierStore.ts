import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ArticlePanier {
    produitId: string;
    nom: string;
    prix: number;
    quantite: number;
    commercantId: string;
    nomBoutique: string;
}

interface PanierState {
    articles: ArticlePanier[];
    commercantId: string | null;
    nomBoutique: string | null;
    ajouterArticle: (article: ArticlePanier) => void;
    retirerArticle: (produitId: string) => void;
    modifierQuantite: (produitId: string, quantite: number) => void;
    viderPanier: () => void;
    totalArticles: () => number;
    totalPrix: () => number;
}

export const usePanierStore = create<PanierState>()(
    persist(
        (set, get) => ({
            articles: [],
            commercantId: null,
            nomBoutique: null,

            ajouterArticle: (article) => {
                const { articles, commercantId } = get();

                // Si panier d'un autre commercant, on vide d'abord
                if (commercantId && commercantId !== article.commercantId) {
                    set({
                        articles: [{ ...article, quantite: 1 }],
                        commercantId: article.commercantId,
                        nomBoutique: article.nomBoutique,
                    });
                    return;
                }

                const existant = articles.find(a => a.produitId === article.produitId);
                if (existant) {
                    set({
                        articles: articles.map(a =>
                            a.produitId === article.produitId
                                ? { ...a, quantite: a.quantite + 1 }
                                : a
                        ),
                    });
                } else {
                    set({
                        articles: [...articles, { ...article, quantite: 1 }],
                        commercantId: article.commercantId,
                        nomBoutique: article.nomBoutique,
                    });
                }
            },

            retirerArticle: (produitId) => {
                const articles = get().articles.filter(a => a.produitId !== produitId);
                set({
                    articles,
                    commercantId: articles.length === 0 ? null : get().commercantId,
                    nomBoutique: articles.length === 0 ? null : get().nomBoutique,
                });
            },

            modifierQuantite: (produitId, quantite) => {
                if (quantite <= 0) {
                    get().retirerArticle(produitId);
                    return;
                }
                set({
                    articles: get().articles.map(a =>
                        a.produitId === produitId ? { ...a, quantite } : a
                    ),
                });
            },

            viderPanier: () => set({ articles: [], commercantId: null, nomBoutique: null }),

            totalArticles: () => get().articles.reduce((acc, a) => acc + a.quantite, 0),

            totalPrix: () => get().articles.reduce((acc, a) => acc + a.prix * a.quantite, 0),
        }),
        { name: 'delici_panier' }
    )
);