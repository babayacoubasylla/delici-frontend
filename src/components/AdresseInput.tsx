import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader } from 'lucide-react';

interface AdresseInputProps {
    label: string;
    couleur: string;
    valeur: string;
    onChange: (description: string, quartier: string) => void;
    placeholder?: string;
}

export default function AdresseInput({ label, couleur, valeur, onChange, placeholder }: AdresseInputProps) {
    const [query, setQuery] = useState(valeur);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const timer = useRef<any>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Fermer quand on clique ailleurs
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { setQuery(valeur); }, [valeur]);

    const rechercher = (val: string) => {
        setQuery(val);
        if (val.length < 2) { setSuggestions([]); setOpen(false); return; }

        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            setLoading(true);
            try {
                // Utiliser Photon API — fonctionne depuis localhost
                const res = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(val + ' Côte d\'Ivoire')}&limit=6&lang=fr`
                );
                const data = await res.json();
                const features = data.features || [];
                setSuggestions(features);
                setOpen(features.length > 0);
            } catch (e) {
                console.error('Erreur suggestion:', e);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 400);
    };

    const choisir = (feature: any) => {
        const props = feature.properties;
        const parties = [
            props.name,
            props.street,
            props.district || props.suburb,
            props.city || props.county,
        ].filter(Boolean);
        const adresse = parties.slice(0, 3).join(', ');
        const quartier = props.district || props.suburb || props.city || props.name || '';
        setQuery(adresse);
        onChange(adresse, quartier);
        setSuggestions([]);
        setOpen(false);
    };

    const vider = () => {
        setQuery('');
        onChange('', '');
        setSuggestions([]);
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: couleur }} />
                {label}
            </label>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <input
                    type="text"
                    value={query}
                    onChange={e => rechercher(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setOpen(true)}
                    className="input-field pl-10 pr-10"
                    placeholder={placeholder || 'Tapez un lieu, quartier, rue...'}
                    autoComplete="off"
                />
                {loading && (
                    <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 animate-spin" />
                )}
                {!loading && query && (
                    <button onClick={vider}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Suggestions */}
            {open && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border-2 border-orange-200 rounded-xl shadow-2xl overflow-hidden">
                    {suggestions.map((s, i) => {
                        const p = s.properties;
                        const titre = p.name || p.street || '';
                        const sous = [p.district || p.suburb, p.city || p.county].filter(Boolean).join(', ');
                        return (
                            <button key={i} onClick={() => choisir(s)}
                                className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0 flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{titre}</p>
                                    {sous && <p className="text-xs text-gray-500 truncate">{sous}</p>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Adresse sélectionnée */}
            {valeur && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl border"
                    style={{ background: '#f0faf4', borderColor: '#86efac' }}>
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-700 font-medium">{valeur}</p>
                </div>
            )}
        </div>
    );
}