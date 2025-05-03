import { RBMKFuel } from './fuel-base.js';
import { EnumBurnFunc, EnumDepleteFunc, NType } from './constants.js';

/**
 * Empty fuel rod
 */
export class NONE extends RBMKFuel {
  constructor() {
    super();
    this.setName("rbmk_fuel_empty");
  }
}

/**
 * Unenriched Uranium fuel
 */
export class UEU extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(15);
    this.setFunction(EnumBurnFunc.LOG_TEN);
    this.setDepletionFunction(EnumDepleteFunc.RAISING_SLOPE);
    this.setHeat(0.65);
    this.setMeltingPoint(2865);
    this.setName("rbmk_fuel_ueu");
    this.setTexture("rbmk_fuel_ueu");
  }
}

/**
 * Medium Enriched Uranium fuel
 */
export class MEU extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(20);
    this.setFunction(EnumBurnFunc.LOG_TEN);
    this.setDepletionFunction(EnumDepleteFunc.RAISING_SLOPE);
    this.setHeat(0.65);
    this.setMeltingPoint(2865);
    this.setName("rbmk_fuel_meu");
    this.setTexture("rbmk_fuel_meu");
  }
}

/**
 * Highly Enriched Uranium-233 fuel
 */
export class HEU233 extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(27.5);
    this.setFunction(EnumBurnFunc.LINEAR);
    this.setHeat(1.25);
    this.setMeltingPoint(2865);
    this.setName("rbmk_fuel_heu233");
    this.setTexture("rbmk_fuel_heu233");
  }
}

/**
 * Highly Enriched Uranium-235 fuel
 */
export class HEU235 extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(50);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setMeltingPoint(2865);
    this.setName("rbmk_fuel_heu235");
    this.setTexture("rbmk_fuel_heu235");
  }
}

/**
 * Thorium with MEU Driver fuel
 */
export class THMEU extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(20);
    this.setFunction(EnumBurnFunc.PLATEU);
    this.setDepletionFunction(EnumDepleteFunc.BOOSTED_SLOPE);
    this.setHeat(0.65);
    this.setMeltingPoint(3350);
    this.setName("rbmk_fuel_thmeu");
    this.setTexture("rbmk_fuel_thmeu");
  }
}

/**
 * Low Enriched Plutonium-239 fuel
 */
export class LEP extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(35);
    this.setFunction(EnumBurnFunc.LOG_TEN);
    this.setDepletionFunction(EnumDepleteFunc.RAISING_SLOPE);
    this.setHeat(0.75);
    this.setMeltingPoint(2744);
    this.setName("rbmk_fuel_lep");
    this.setTexture("rbmk_fuel_lep");
  }
}

/**
 * Medium Enriched Plutonium-239 fuel
 */
export class MEP extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(35, 20);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setMeltingPoint(2744);
    this.setName("rbmk_fuel_mep");
    this.setTexture("rbmk_fuel_mep");
  }
}

/**
 * Highly Enriched Plutonium-239 fuel
 */
export class HEP239 extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(30);
    this.setFunction(EnumBurnFunc.LINEAR);
    this.setHeat(1.25);
    this.setMeltingPoint(2744);
    this.setName("rbmk_fuel_hep");
    this.setTexture("rbmk_fuel_hep");
  }
}

/**
 * Highly Enriched Plutonium-241 fuel
 */
export class HEP241 extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(40);
    this.setFunction(EnumBurnFunc.LINEAR);
    this.setHeat(1.75);
    this.setMeltingPoint(2744);
    this.setName("rbmk_fuel_hep241");
    this.setTexture("rbmk_fuel_hep241");
  }
}

/**
 * Low Enriched Americium-242 fuel
 */
export class LEA extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(60, 10);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setDepletionFunction(EnumDepleteFunc.RAISING_SLOPE);
    this.setHeat(1.5);
    this.setMeltingPoint(2386);
    this.setName("rbmk_fuel_lea");
    this.setTexture("rbmk_fuel_lea");
  }
}

/**
 * Medium Enriched Americium-242 fuel
 */
export class MEA extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(35, 20);
    this.setFunction(EnumBurnFunc.ARCH);
    this.setHeat(1.75);
    this.setMeltingPoint(2386);
    this.setName("rbmk_fuel_mea");
    this.setTexture("rbmk_fuel_mea");
  }
}

/**
 * Highly Enriched Americium-241 fuel
 */
export class HEA241 extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(65, 15);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setHeat(1.85);
    this.setMeltingPoint(2386);
    this.setNeutronTypes(NType.FAST, NType.FAST);
    this.setName("rbmk_fuel_hea241");
    this.setTexture("rbmk_fuel_hea241");
  }
}

/**
 * Highly Enriched Americium-242 fuel
 */
export class HEA242 extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(45);
    this.setFunction(EnumBurnFunc.LINEAR);
    this.setHeat(2);
    this.setMeltingPoint(2386);
    this.setName("rbmk_fuel_hea242");
    this.setTexture("rbmk_fuel_hea242");
  }
}

/**
 * Medium Enriched Neptunium-237 fuel
 */
export class MEN extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(30);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setDepletionFunction(EnumDepleteFunc.RAISING_SLOPE);
    this.setHeat(0.75);
    this.setMeltingPoint(2800);
    this.setNeutronTypes(NType.ANY, NType.FAST);
    this.setName("rbmk_fuel_men");
    this.setTexture("rbmk_fuel_men");
  }
}

/**
 * Highly Enriched Neptunium-237 fuel
 */
export class HEN extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(40);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setMeltingPoint(2800);
    this.setNeutronTypes(NType.FAST, NType.FAST);
    this.setName("rbmk_fuel_hen");
    this.setTexture("rbmk_fuel_hen");
  }
}

/**
 * Mixed MEU & LEP Oxide fuel
 */
export class MOX extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(40);
    this.setFunction(EnumBurnFunc.LOG_TEN);
    this.setDepletionFunction(EnumDepleteFunc.RAISING_SLOPE);
    this.setMeltingPoint(2815);
    this.setName("rbmk_fuel_mox");
    this.setTexture("rbmk_fuel_mox");
  }
}

/**
 * Low Enriched Schrabidium-326 fuel
 */
export class LES extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(50);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setHeat(1.25);
    this.setMeltingPoint(2800);
    this.setNeutronTypes(NType.SLOW, NType.SLOW);
    this.setName("rbmk_fuel_les");
    this.setTexture("rbmk_fuel_les");
  }
}

/**
 * Medium Enriched Schrabidium-326 fuel
 */
export class MES extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(75);
    this.setFunction(EnumBurnFunc.ARCH);
    this.setHeat(1.5);
    this.setMeltingPoint(2750);
    this.setName("rbmk_fuel_mes");
    this.setTexture("rbmk_fuel_mes");
  }
}

/**
 * Highly Enriched Schrabidium-326 fuel
 */
export class HES extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(90);
    this.setFunction(EnumBurnFunc.LINEAR);
    this.setDepletionFunction(EnumDepleteFunc.LINEAR);
    this.setHeat(1.75);
    this.setMeltingPoint(3000);
    this.setName("rbmk_fuel_hes");
    this.setTexture("rbmk_fuel_hes");
  }
}

/**
 * Low Enriched Australium (Tasmanite) fuel
 */
export class LEAUS extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(30);
    this.setFunction(EnumBurnFunc.SIGMOID);
    this.setDepletionFunction(EnumDepleteFunc.LINEAR);
    this.setXenon(0.05, 50);
    this.setHeat(1.5);
    this.setMeltingPoint(7029);
    this.setName("rbmk_fuel_leaus");
    this.setTexture("rbmk_fuel_leaus");
  }
}

/**
 * Highly Enriched Australium (Ayerite) fuel
 */
export class HEAUS extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(35);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setXenon(0.05, 50);
    this.setHeat(2);
    this.setMeltingPoint(5211);
    this.setName("rbmk_fuel_heaus");
    this.setTexture("rbmk_fuel_heaus");
  }
}

/**
 * Polonium-210 & Beryllium Neutron Source
 */
export class PO210BE extends RBMKFuel {
  constructor() {
    super();
    this.setYield(25000000);
    this.setStats(0, 50);
    this.setFunction(EnumBurnFunc.PASSIVE);
    this.setDepletionFunction(EnumDepleteFunc.LINEAR);
    this.setXenon(0.0, 50);
    this.setHeat(0.1);
    this.setDiffusion(0.05);
    this.setMeltingPoint(1287);
    this.setNeutronTypes(NType.SLOW, NType.SLOW);
    this.setName("rbmk_fuel_po210be");
    this.setTexture("rbmk_fuel_po210be");
  }
}

/**
 * Radium-226 & Beryllium Neutron Source
 */
export class RA226BE extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(0, 20);
    this.setFunction(EnumBurnFunc.PASSIVE);
    this.setDepletionFunction(EnumDepleteFunc.LINEAR);
    this.setXenon(0.0, 50);
    this.setHeat(0.035);
    this.setDiffusion(0.5);
    this.setMeltingPoint(700);
    this.setNeutronTypes(NType.SLOW, NType.SLOW);
    this.setName("rbmk_fuel_ra226be");
    this.setTexture("rbmk_fuel_ra226be");
  }
}

/**
 * Plutonium-238 & Beryllium Neutron Source
 */
export class PU238BE extends RBMKFuel {
  constructor() {
    super();
    this.setYield(50000000);
    this.setStats(40, 40);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setHeat(0.1);
    this.setDiffusion(0.05);
    this.setMeltingPoint(1287);
    this.setNeutronTypes(NType.SLOW, NType.SLOW);
    this.setName("rbmk_fuel_pu238be");
    this.setTexture("rbmk_fuel_pu238be");
  }
}

/**
 * Antihydrogen in a Magnetized Gold-198 Lattice
 */
export class BALEFIRE_GOLD extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(40, 40);
    this.setFunction(EnumBurnFunc.ARCH);
    this.setDepletionFunction(EnumDepleteFunc.LINEAR);
    this.setXenon(0.0, 50);
    this.setMeltingPoint(2000);
    this.setName("rbmk_fuel_balefire_gold");
    this.setTexture("rbmk_fuel_balefire_gold");
  }
}

/**
 * Antihydrogen confined by a Magnetized Gold-198 and Lead-209 Lattice
 */
export class FLASHLEAD extends RBMKFuel {
  constructor() {
    super();
    this.setYield(250000000);
    this.setStats(40, 50);
    this.setFunction(EnumBurnFunc.ARCH);
    this.setDepletionFunction(EnumDepleteFunc.LINEAR);
    this.setXenon(0.0, 50);
    this.setMeltingPoint(2050);
    this.setName("rbmk_fuel_flashlead");
    this.setTexture("rbmk_fuel_flashlead");
  }
}

/**
 * Draconic Flames
 */
export class BALEFIRE extends RBMKFuel {
  constructor() {
    super();
    this.setYield(100000000);
    this.setStats(100, 35);
    this.setFunction(EnumBurnFunc.ARCH);
    this.setDepletionFunction(EnumDepleteFunc.LINEAR);
    this.setXenon(0.0, 50);
    this.setHeat(3);
    this.setMeltingPoint(3652);
    this.setName("rbmk_fuel_balefire");
    this.setTexture("rbmk_fuel_balefire");
  }
}

/**
 * Zirconium Fast Breeder - LEU/HEP-241#Bi
 */
export class ZFB_BISMUTH extends RBMKFuel {
  constructor() {
    super();
    this.setYield(50000000);
    this.setStats(20);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setHeat(1.75);
    this.setMeltingPoint(2744);
    this.setName("rbmk_fuel_zfb_bismuth");
    this.setTexture("rbmk_fuel_zfb_bismuth");
  }
}

/**
 * Zirconium Fast Breeder - HEU-235/HEP-240#Pu-241
 */
export class ZFB_PU241 extends RBMKFuel {
  constructor() {
    super();
    this.setYield(50000000);
    this.setStats(20);
    this.setFunction(EnumBurnFunc.SQUARE_ROOT);
    this.setMeltingPoint(2865);
    this.setName("rbmk_fuel_zfb_pu241");
    this.setTexture("rbmk_fuel_zfb_pu241");
  }
}

/**
 * Zirconium Fast Breeder - HEP-241#MEA
 */
export class ZFB_AM_MIX extends RBMKFuel {
  constructor() {
    super();
    this.setYield(50000000);
    this.setStats(20);
    this.setFunction(EnumBurnFunc.LINEAR);
    this.setHeat(1.75);
    this.setMeltingPoint(2744);
    this.setName("rbmk_fuel_zfb_am_mix");
    this.setTexture("rbmk_fuel_zfb_am_mix");
  }
}

/**
 * Digamma RBMK Fuel Rod
 */
export class DRX extends RBMKFuel {
  constructor() {
    super();
    this.setYield(1000000);
    this.setStats(1000, 10);
    this.setFunction(EnumBurnFunc.QUADRATIC);
    this.setHeat(0.1);
    this.setMeltingPoint(100000);
    this.setName("rbmk_fuel_drx");
    this.setTexture("rbmk_fuel_drx");
  }
}

/**
 * Test fuel
 */
export class TEST extends RBMKFuel {
  constructor() {
    super();
    this.setYield(1000000);
    this.setStats(100);
    this.setFunction(EnumBurnFunc.EXPERIMENTAL);
    this.setHeat(1.0);
    this.setMeltingPoint(100000);
    this.setName("rbmk_fuel_test");
    this.setTexture("rbmk_fuel_test");
  }
}

// Export all fuel types in an array
export const fuels = [
  NONE, UEU, MEU, HEU233, HEU235, THMEU, LEP, MEP, HEP239, HEP241, 
  LEA, MEA, HEA241, HEA242, MEN, HEN, MOX, LES, MES, HES, 
  LEAUS, HEAUS, PO210BE, RA226BE, PU238BE, BALEFIRE_GOLD, FLASHLEAD, BALEFIRE, 
  ZFB_BISMUTH, ZFB_PU241, ZFB_AM_MIX, DRX, TEST
];