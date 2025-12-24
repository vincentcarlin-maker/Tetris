import { MapConfig } from './types';

export const MAPS: MapConfig[] = [
    {
        id: 'city',
        name: 'MÉGAPOPOLE NÉON 2.0',
        colors: { bg: '#050508', grid: 'rgba(0, 217, 255, 0.05)', wall: '#0a0a1a', wallBorder: '#00f3ff' },
        zones: [
            { x: 1200, y: 1200, radius: 150, type: 'HEAL', label: 'MED-CENTER' },
            { x: 400, y: 400, radius: 100, type: 'BOOST', label: 'OVERCHARGE' },
            { x: 2000, y: 2000, radius: 100, type: 'BOOST', label: 'OVERCHARGE' },
            { x: 1200, y: 400, radius: 120, type: 'DANGER', label: 'VOLTAGE AREA' },
            { x: 1200, y: 2000, radius: 120, type: 'DANGER', label: 'VOLTAGE AREA' },
        ],
        obstacles: [
            { x: 100, y: 100, w: 400, h: 400, type: 'building', subType: 'HELIPAD' },
            { x: 520, y: 100, w: 150, h: 250, type: 'building', subType: 'HVAC' },
            { x: 520, y: 380, w: 150, h: 30, type: 'bench' },
            { x: 100, y: 550, w: 400, h: 15, type: 'barrier' },
            { x: 550, y: 550, w: 15, h: 15, type: 'pylon' },
            { x: 1700, y: 100, w: 300, h: 500, type: 'building', subType: 'HVAC' },
            { x: 2100, y: 100, w: 200, h: 200, type: 'building', subType: 'OFFICE' },
            { x: 1700, y: 650, w: 400, h: 15, type: 'barrier' },
            { x: 2150, y: 350, w: 20, h: 20, type: 'trash_bin' },
            { x: 950, y: 950, w: 500, h: 500, type: 'building', subType: 'HQ' },
            { x: 1100, y: 880, w: 100, h: 30, type: 'bench' },
            { x: 100, y: 1700, w: 450, h: 300, type: 'building', subType: 'HVAC' },
            { x: 600, y: 1700, w: 100, h: 500, type: 'building', subType: 'ROOF_DETAIL' },
            { x: 1700, y: 1700, w: 300, h: 300, type: 'building', subType: 'OFFICE' },
            { x: 2100, y: 1700, w: 200, h: 600, type: 'building', subType: 'HVAC' },
        ]
    },
    {
        id: 'forest',
        name: 'FORÊT ÉMERAUDE 2.0',
        colors: { bg: '#020a05', grid: 'rgba(34, 197, 94, 0.05)', wall: '#051a08', wallBorder: '#22c55e' },
        zones: [
            { x: 1200, y: 1200, radius: 180, type: 'HEAL', label: 'SOURCE SACRÉE' },
            { x: 400, y: 400, radius: 120, type: 'BOOST', label: 'PULSE SECTOR' },
            { x: 2000, y: 2000, radius: 120, type: 'BOOST', label: 'PULSE SECTOR' },
        ],
        obstacles: [
            { x: 300, y: 200, w: 100, h: 100, type: 'tree' },
            { x: 450, y: 250, w: 80, h: 80, type: 'tree' },
            { x: 380, y: 350, w: 40, h: 40, type: 'bush' },
            { x: 500, y: 200, w: 20, h: 20, type: 'mushroom' },
            { x: 150, y: 900, w: 300, h: 300, type: 'building', subType: 'LAB' },
            { x: 800, y: 1800, w: 150, h: 150, type: 'tree' },
            { x: 1050, y: 1050, w: 300, h: 300, type: 'pond', subType: 'RUIN' },
            { x: 0, y: 1200, w: 2400, h: 100, type: 'pond', subType: 'RIVER' },
        ]
    },
    {
        id: 'mountain',
        name: 'PIC DES BRUMES 3.0',
        colors: { bg: '#050a15', grid: 'rgba(255, 255, 255, 0.03)', wall: '#1a1f2e', wallBorder: '#cffafe' },
        zones: [
            { x: 1200, y: 1200, radius: 250, type: 'HEAL', label: 'SOURCE THERMALE' },
            { x: 600, y: 600, radius: 180, type: 'SLOW', label: 'CONGÈRE PROFONDE' },
            { x: 1800, y: 1800, radius: 180, type: 'SLOW', label: 'CONGÈRE PROFONDE' },
            { x: 400, y: 2000, radius: 120, type: 'DANGER', label: 'CREVASSE' },
            { x: 2000, y: 400, radius: 120, type: 'DANGER', label: 'CREVASSE' },
        ],
        obstacles: [
            { x: 800, y: 200, w: 300, h: 200, type: 'rock', subType: 'CRAG' },
            { x: 300, y: 1000, w: 150, h: 400, type: 'peak' },
            { x: 1800, y: 900, w: 200, h: 600, type: 'rock', subType: 'CRAG' },
            { x: 1100, y: 1800, w: 400, h: 100, type: 'peak' },
            { x: 200, y: 200, w: 80, h: 80, type: 'ice_pillar', subType: 'FROST_CORE' },
            { x: 2100, y: 2100, w: 80, h: 80, type: 'ice_pillar', subType: 'FROST_CORE' },
            { x: 1500, y: 500, w: 60, h: 60, type: 'crystal' },
            { x: 500, y: 1500, w: 60, h: 60, type: 'crystal' },
            { x: 1200, y: 700, w: 40, h: 40, type: 'pylon' },
            { x: 1200, y: 1700, w: 40, h: 40, type: 'pylon' },
        ]
    },
    {
        id: 'solar_dust',
        name: 'SOLAR DUST 2.0',
        colors: { bg: '#1a0d02', grid: 'rgba(249, 115, 22, 0.08)', wall: '#2b1a0a', wallBorder: '#facc15' },
        zones: [
            { x: 1200, y: 1200, radius: 220, type: 'HEAL', label: 'OASIS SACRÉ' },
            { x: 400, y: 400, radius: 150, type: 'SLOW', label: 'DUNES PROFONDES' },
            { x: 2000, y: 400, radius: 150, type: 'SLOW', label: 'DUNES PROFONDES' },
        ],
        obstacles: [
            { x: 1100, y: 1100, w: 200, h: 200, type: 'pond', subType: 'OASIS' },
            { x: 1020, y: 1020, w: 60, h: 60, type: 'palm' },
            { x: 1320, y: 1320, w: 60, h: 60, type: 'palm' },
            { x: 200, y: 200, w: 300, h: 300, type: 'building', subType: 'PYRAMID' },
            { x: 1800, y: 1800, w: 400, h: 400, type: 'building', subType: 'ZIGGURAT' },
            { x: 1800, y: 200, w: 300, h: 300, type: 'building', subType: 'PYRAMID' },
            { x: 900, y: 100, w: 40, h: 120, type: 'obelisk', subType: 'RUIN' },
            { x: 1400, y: 100, w: 40, h: 120, type: 'obelisk', subType: 'RUIN' },
            { x: 500, y: 1200, w: 100, h: 100, type: 'crystal' },
            { x: 1700, y: 1200, w: 120, h: 120, type: 'crystal' },
            { x: 1200, y: 1800, w: 80, h: 80, type: 'crystal' },
            { x: 800, y: 800, w: 200, h: 100, type: 'bone' },
            { x: 1400, y: 1500, w: 150, h: 80, type: 'bone' },
            { x: 400, y: 1800, w: 40, h: 40, type: 'cactus' },
            { x: 2100, y: 1000, w: 50, h: 50, type: 'cactus' },
        ]
    }
];