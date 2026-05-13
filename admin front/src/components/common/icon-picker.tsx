import React, { useState } from 'react';
import {
    Utensils, Pizza, Coffee, IceCream, Beef, Fish, Sandwich,
    Soup, Salad, Croissant, Flame, Search
} from 'lucide-react';
// Lucide doesn't have all exact matches, I'll map to closest available
// "burger" -> Beef (or Utensils if preferred, but usually Beef/Sandwich)
// "crepe" -> Scroll or similar? Let's stick to generic if missing.
// "asian" -> Soup (Bowl)
// "pasta" -> UtensilsCrossed

const ICON_MAP: Record<string, any> = {
    burger: Beef, // Placeholder
    pizza: Pizza,
    crepe: Croissant, // Close enough
    coffee: Coffee,
    dessert: IceCream,
    drinks: Coffee,
    chicken: Utensils, // Placeholder
    fish: Fish,
    sandwich: Sandwich,
    breakfast: Coffee,
    healthy: Salad,
    icecream: IceCream,
    bakery: Croissant,
    grill: Flame,
    asian: Soup,
    pasta: Utensils
};

interface IconPickerProps {
    value?: string;
    onChange: (key: string) => void;
    error?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, error }) => {
    const [search, setSearch] = useState('');

    const filteredKeys = Object.keys(ICON_MAP).filter(key =>
        key.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search icons..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-md bg-slate-50">
                {filteredKeys.map(key => {
                    const Icon = ICON_MAP[key];
                    const isSelected = value === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onChange(key)}
                            title={key}
                            className={`flex flex-col items-center justify-center p-2 rounded-md transition-all ${isSelected
                                ? 'bg-primary text-white shadow-sm ring-2 ring-primary ring-offset-1'
                                : 'bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] mt-1 truncate w-full text-center">{key}</span>
                        </button>
                    );
                })}
                {filteredKeys.length === 0 && (
                    <div className="col-span-6 py-4 text-center text-xs text-slate-500">
                        No icons found.
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};

export const CategoryIcon: React.FC<{ iconKey?: string; className?: string }> = ({ iconKey, className }) => {
    if (!iconKey || !ICON_MAP[iconKey]) return null;
    const Icon = ICON_MAP[iconKey];
    return <Icon className={className || "w-5 h-5"} />;
};
