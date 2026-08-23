import { describe, it, expect } from 'vitest';

describe('FilterBar viewMode counts logic', () => {
  it('should maintain stable counts across ALL, NEEDS, and OFFERS view modes', () => {
    const needsCount = 12;
    const offersCount = 5;

    const getViewModeOptions = (needs: number, offers: number) => [
      { value: 'ALL', count: needs + offers },
      { value: 'NEEDS', count: needs },
      { value: 'OFFERS', count: offers },
    ];

    // When viewMode is ALL
    const optionsAll = getViewModeOptions(needsCount, offersCount);
    expect(optionsAll.find(o => o.value === 'ALL')?.count).toBe(17);
    expect(optionsAll.find(o => o.value === 'NEEDS')?.count).toBe(12);
    expect(optionsAll.find(o => o.value === 'OFFERS')?.count).toBe(5);

    // When viewMode is NEEDS (counts MUST NOT change or drop to 0)
    const optionsNeeds = getViewModeOptions(needsCount, offersCount);
    expect(optionsNeeds.find(o => o.value === 'ALL')?.count).toBe(17);
    expect(optionsNeeds.find(o => o.value === 'NEEDS')?.count).toBe(12);
    expect(optionsNeeds.find(o => o.value === 'OFFERS')?.count).toBe(5);

    // When viewMode is OFFERS (counts MUST NOT change or drop to 0)
    const optionsOffers = getViewModeOptions(needsCount, offersCount);
    expect(optionsOffers.find(o => o.value === 'ALL')?.count).toBe(17);
    expect(optionsOffers.find(o => o.value === 'NEEDS')?.count).toBe(12);
    expect(optionsOffers.find(o => o.value === 'OFFERS')?.count).toBe(5);
  });
});
