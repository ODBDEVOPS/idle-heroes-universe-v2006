import { TowerSection } from '../models/tower.model';

export const ALL_TOWER_SECTIONS: TowerSection[] = [
    {
        id: 'verdant_ramparts',
        name: 'The Verdant Ramparts',
        floorStart: 1,
        floorEnd: 10,
        theme: {
            background: 'linear-gradient(to bottom, #1e3a8a, #1e40af, #1d4ed8)', // shades of blue
            textColor: '#93c5fd' // text-blue-300
        }
    },
    {
        id: 'frozen_spires',
        name: 'The Frozen Spires',
        floorStart: 11,
        floorEnd: 20,
        theme: {
            background: 'linear-gradient(to bottom, #082f49, #075985, #0369a1)', // shades of cyan/sky
            textColor: '#67e8f9' // text-cyan-300
        }
    },
    // Future sections can be added here
];
