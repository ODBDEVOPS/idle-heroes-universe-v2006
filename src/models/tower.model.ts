export interface TowerSection {
    id: string;
    name: string;
    floorStart: number;
    floorEnd: number;
    theme: {
        background: string;
        textColor: string;
    };
}

export interface TowerChallenge {
    type: 'Combat' | 'Treasure' | 'Mystery';
    title: string;
    description: string;
    rewardText: string;
    style: {
        borderColor: string;
        textColor: string;
        shadowColor: string;
        dividerColor: string;
        icon: string;
    };
}

export interface TowerChallengeOutcome {
    type: 'combat_start' | 'reward';
    title: string;
    description: string;
}

// This will hold the state for an active tower run, can be expanded later
export interface TowerState {
    currentChoices: TowerChallenge[];
}
