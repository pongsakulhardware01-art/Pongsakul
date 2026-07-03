export interface Prices {
  normalBoardPrice: number;
  mocBoardPrice: number;
  i15Price: number;
  // I-18
  i18NoTISPrice: number;
  i18TISPrice: number;
  i18JointPrice: number;
  i18TISJointPrice: number;
  // I-22
  i22NoTISPrice: number;
  i22TISPrice: number;
  i22JointPrice: number;
  i22TISJointPrice: number;
  // Others
  i26NoTISPrice: number;
  i26NoTISJointPrice: number;
  i26TISPrice: number;
  i26TISJointPrice: number;
  i30NoTISPrice: number;
  i30NoTISJointPrice: number;
  i30TISPrice: number;
  i30TISJointPrice: number;
  i35TISPrice: number;
  i35TISJointPrice: number;
  i40TISPrice: number;
  i40TISJointPrice: number;
  hexPilePrice: number;
  // S-Piles (Solid Square Piles)
  s18Price: number;
  s18JointPrice: number;
  s22Price: number;
  s22JointPrice: number;
  s26Price: number;
  s26JointPrice: number;
  s30Price: number;
  s30JointPrice: number;
  s35Price: number;
  s35JointPrice: number;
  s40Price: number;
  s40JointPrice: number;
  fence3Price: number;
  fence4Price: number;
  hcPriceSqm: number;
  vatPercent: number;
  // Pipe and Basin Prices
  pipe030NoTISPrice: number;
  pipe030T3Price: number;
  pipe030T2Price: number;
  pipe040NoTISPrice: number;
  pipe040T3Price: number;
  pipe040T2Price: number;
  pipe050NoTISPrice: number;
  pipe050T3Price: number;
  pipe050T2Price: number;
  pipe060NoTISPrice: number;
  pipe060T3Price: number;
  pipe060T2Price: number;
  pipe080NoTISPrice: number;
  pipe080T3Price: number;
  pipe080T2Price: number;
  pipe100NoTISPrice: number;
  pipe100T3Price: number;
  pipe100T2Price: number;
  pipe120NoTISPrice: number;
  pipe120T3Price: number;
  pipe120T2Price: number;
  pipe150NoTISPrice: number;
  pipe150T3Price: number;
  pipe150T2Price: number;
  basin030Price: number;
  basin040Price: number;
  basin050Price: number;
  basin060Price: number;
  basin080Price: number;
  basin100Price: number;
  basin120Price: number;
}

export interface Weights {
  slab: number;
  fence3: number;
  fence4: number;
  hex: number;
  i15: number;
  i18_no_tis: number;
  i18_tis: number;
  i22_no_tis: number;
  i22_tis: number;
  i26_no_tis: number;
  i26_tis: number;
  i30_no_tis: number;
  i30_tis: number;
  i35: number;
  i40: number;
  s18: number;
  s22: number;
  s26: number;
  s30: number;
  s35: number;
  s40: number;
  // Pipe and Basin Weights
  pipe030Weight: number;
  pipe030T3Weight: number;
  pipe030T2Weight: number;
  pipe040Weight: number;
  pipe040T3Weight: number;
  pipe040T2Weight: number;
  pipe050Weight: number;
  pipe050T3Weight: number;
  pipe050T2Weight: number;
  pipe060Weight: number;
  pipe060T3Weight: number;
  pipe060T2Weight: number;
  pipe080Weight: number;
  pipe080T3Weight: number;
  pipe080T2Weight: number;
  pipe100Weight: number;
  pipe100T3Weight: number;
  pipe100T2Weight: number;
  pipe120Weight: number;
  pipe120T3Weight: number;
  pipe120T2Weight: number;
  pipe150Weight: number;
  pipe150T3Weight: number;
  pipe150T2Weight: number;
  basin030Weight: number;
  basin040Weight: number;
  basin050Weight: number;
  basin060Weight: number;
  basin080Weight: number;
  basin100Weight: number;
  basin120Weight: number;
}

export interface AppSettings {
  prices: Prices;
  weights: Weights;
}

export interface WeightItem {
  id: string;
  type: string;
  count: number | "";
  length: number | "";
  unitWeight?: number | "";
}
